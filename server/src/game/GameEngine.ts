import {
  Player,
  RoleType,
  PhaseType,
  NightSubPhase,
  RoomState,
  NightAction,
  VoteRecord,
  ChatMessage,
  GameLog,
  GameSettings,
  DeathAnnouncement,
  SeerInspectionResult,
  Team,
  DEFAULT_TIMERS,
  MIN_PLAYERS,
  MAX_PLAYERS,
  RECOMMENDED_ROLE_CONFIGS,
  VICTORY_MESSAGES,
  BOT_NAMES,
  DEFAULT_AVATARS,
  isEvilRole,
  getRoleTeam,
} from '@werewolf/shared';

export interface GameEngineOptions {
  code: string;
  hostPlayer: { id: string; name: string; avatar: string };
  settings?: Partial<GameSettings>;
}

export class GameEngine {
  public state: RoomState;
  private lastProtectedPlayerId: string | null = null;
  private werewolfVotes: Record<string, string> = {}; // wolfId -> targetId
  private timerInterval: NodeJS.Timeout | null = null;
  private botTimeouts: NodeJS.Timeout[] = [];
  public isTestMode: boolean = false;
  public onStateUpdate?: (state: RoomState) => void;

  constructor(options: GameEngineOptions) {
    const defaultSettings: GameSettings = {
      nightDuration: DEFAULT_TIMERS.NIGHT_SUBPHASE || 20,
      discussionDuration: DEFAULT_TIMERS.DISCUSSION,
      votingDuration: DEFAULT_TIMERS.VOTING,
      minPlayers: MIN_PLAYERS,
      enableMayor: true,
      rolesCount: {},
      ...options.settings,
    };

    const host: Player = {
      id: options.hostPlayer.id,
      name: options.hostPlayer.name,
      avatar: options.hostPlayer.avatar,
      role: null,
      isAlive: true,
      isHost: true,
      isMayor: false,
      isProtected: false,
      isPoisoned: false,
      isLover: false,
      votesReceived: 0,
      connected: true,
    };

    this.state = {
      code: options.code.toUpperCase(),
      hostId: options.hostPlayer.id,
      phase: 'LOBBY',
      nightSubPhase: null,
      dayNumber: 0,
      timer: 0,
      totalTime: 0,
      players: [host],
      winner: null,
      winReason: null,
      votes: {},
      nightVictims: {
        wolfVictimId: null,
        poisonVictimId: null,
        savedVictimId: null,
        deathIds: [],
      },
      lastNightDeaths: [],
      lovers: null,
      witchInventory: {
        hasSavePotion: true,
        hasPoisonPotion: true,
      },
      hunterPending: null,
      messages: [],
      logs: [],
      settings: defaultSettings,
    };

    this.addLog('Phòng chơi được tạo. Đang chờ người chơi tham gia...', 'INFO');
  }

  // ==========================================
  // ROOM & PLAYER MANAGEMENT
  // ==========================================

  public addPlayer(player: { id: string; name: string; avatar: string }): Player {
    if (this.state.phase !== 'LOBBY') {
      throw new Error('Không thể tham gia khi ván đấu đã bắt đầu');
    }
    const existing = this.state.players.find((p) => p.id === player.id);
    if (existing) {
      existing.name = player.name;
      existing.avatar = player.avatar;
      existing.connected = true;
      return existing;
    }

    const newPlayer: Player = {
      id: player.id,
      name: player.name,
      avatar: player.avatar,
      role: null,
      isAlive: true,
      isHost: false,
      isMayor: false,
      isProtected: false,
      isPoisoned: false,
      isLover: false,
      votesReceived: 0,
      connected: true,
    };

    this.state.players.push(newPlayer);
    this.addLog(`${newPlayer.name} đã tham gia phòng chơi`, 'INFO');
    this.notifyUpdate();
    return newPlayer;
  }

  public removePlayer(playerId: string): void {
    const index = this.state.players.findIndex((p) => p.id === playerId);
    if (index === -1) return;

    const removed = this.state.players[index];
    if (this.state.phase === 'LOBBY') {
      this.state.players.splice(index, 1);
      if (removed.isHost && this.state.players.length > 0) {
        this.state.players[0].isHost = true;
        this.state.hostId = this.state.players[0].id;
      }
    } else {
      // In-game disconnect
      removed.connected = false;
    }

    this.addLog(`${removed.name} đã rời phòng`, 'INFO');
    this.notifyUpdate();
  }

  public addBot(customName?: string): Player {
    if (this.state.phase !== 'LOBBY') {
      throw new Error('Chỉ có thể thêm bot khi đang ở phòng chờ');
    }
    if (this.state.players.length >= MAX_PLAYERS) {
      throw new Error(`Đã đạt giới hạn tối đa ${MAX_PLAYERS} người chơi`);
    }

    const existingNames = new Set(this.state.players.map((p) => p.name));
    let botName = customName;
    if (!botName) {
      const availableName = BOT_NAMES.find((n) => !existingNames.has(n));
      botName = availableName || `🤖 Bot ${this.state.players.length + 1}`;
    }

    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    const botPlayer: Player = {
      id: botId,
      name: botName,
      avatar: randomAvatar,
      role: null,
      isAlive: true,
      isHost: false,
      isMayor: false,
      isProtected: false,
      isPoisoned: false,
      isLover: false,
      votesReceived: 0,
      connected: true,
      isBot: true,
    };

    this.state.players.push(botPlayer);
    this.addLog(`${botPlayer.name} đã được thêm vào phòng chơi`, 'INFO');
    this.notifyUpdate();
    return botPlayer;
  }

  public removeBot(botId: string): boolean {
    if (this.state.phase !== 'LOBBY') {
      throw new Error('Chỉ có thể xóa bot khi đang ở phòng chờ');
    }

    const index = this.state.players.findIndex((p) => p.id === botId && p.isBot);
    if (index === -1) return false;

    const removed = this.state.players[index];
    this.state.players.splice(index, 1);
    this.addLog(`${removed.name} đã bị xóa khỏi phòng`, 'INFO');
    this.notifyUpdate();
    return true;
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  public getAlivePlayers(): Player[] {
    return this.state.players.filter((p) => p.isAlive);
  }

  public updateSettings(newSettings: Partial<GameSettings>): void {
    if (this.state.phase !== 'LOBBY') return;
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.notifyUpdate();
  }

  // ==========================================
  // GAME START & ROLE ASSIGNMENT
  // ==========================================

  public startGame(): void {
    if (this.state.phase !== 'LOBBY') {
      throw new Error('Ván đấu đã bắt đầu rồi');
    }
    const count = this.state.players.length;
    const minPlayers = this.state.settings.minPlayers || MIN_PLAYERS;
    if (count < minPlayers) {
      throw new Error(`Cần tối thiểu ${minPlayers} người chơi để bắt đầu`);
    }

    this.assignRoles();

    this.state.dayNumber = 1;
    this.state.winner = null;
    this.state.winReason = null;
    this.state.lovers = null;
    this.state.witchInventory = { hasSavePotion: true, hasPoisonPotion: true };
    this.lastProtectedPlayerId = null;

    this.addLog(`Ván đấu bắt đầu với ${count} người chơi! Đêm đầu tiên buông xuống...`, 'INFO');
    this.startNight();
  }

  private assignRoles(): void {
    const count = this.state.players.length;
    let roles: RoleType[] = [];

    // Check if custom role counts were configured
    const customConfig = this.state.settings.rolesCount;
    if (customConfig && Object.keys(customConfig).length > 0) {
      for (const [role, num] of Object.entries(customConfig)) {
        for (let i = 0; i < (num || 0); i++) {
          roles.push(role as RoleType);
        }
      }
    }

    // Fall back to recommended configs or dynamic generation
    if (roles.length !== count) {
      if (RECOMMENDED_ROLE_CONFIGS[count]) {
        roles = [...RECOMMENDED_ROLE_CONFIGS[count]];
      } else {
        // Dynamic balance
        const wolfCount = Math.max(1, Math.floor(count / 3));
        roles = Array(wolfCount).fill('WEREWOLF');
        roles.push('SEER');
        if (count >= 5) roles.push('BODYGUARD');
        if (count >= 5) roles.push('WITCH');
        if (count >= 6) roles.push('HUNTER');
        if (count >= 7) roles.push('CUPID');

        while (roles.length < count) {
          roles.push('VILLAGER');
        }
        roles = roles.slice(0, count);
      }
    }

    // Shuffle roles (Fisher-Yates)
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign to players
    this.state.players.forEach((p, idx) => {
      p.role = roles[idx];
      p.isAlive = true;
      p.isMayor = false;
      p.isProtected = false;
      p.isPoisoned = false;
      p.isLover = false;
      p.loverId = null;
      p.votesReceived = 0;
      p.deathReason = null;
      p.deathPhase = null;
    });
  }

  // ==========================================
  // NIGHT PHASES & SEQUENCING
  // ==========================================

  public startNight(): void {
    this.state.phase = 'NIGHT';
    this.werewolfVotes = {};
    this.state.votes = {};
    this.state.nightVictims = {
      wolfVictimId: null,
      poisonVictimId: null,
      savedVictimId: null,
      deathIds: [],
    };

    // Reset transient flags for alive players
    this.state.players.forEach((p) => {
      p.isProtected = false;
      p.isPoisoned = false;
      p.targetPlayerId = null;
      p.votesReceived = 0;
    });

    this.addLog(`Đêm thứ ${this.state.dayNumber} bắt đầu. Ngôi làng chìm vào giấc ngủ...`, 'INFO');
    this.state.nightSubPhase = null;
    this.advanceToNextNightSubPhase();
  }

  private advanceToNextNightSubPhase(): void {
    const subPhases: NightSubPhase[] = ['CUPID', 'BODYGUARD', 'WEREWOLF', 'WITCH', 'SEER'];
    const current = this.state.nightSubPhase;
    let nextIndex = current ? subPhases.indexOf(current) + 1 : 0;

    while (nextIndex < subPhases.length) {
      const candidate = subPhases[nextIndex];
      const isActive = this.isNightSubPhaseActive(candidate);

      if (isActive) {
        this.setNightSubPhase(candidate, true);
        return;
      } else {
        // If no active player for this role and not in test mode:
        // Briefly pause for 2s so all players observe the sequential village flow
        if (!this.isTestMode) {
          this.setNightSubPhase(candidate, false);
          return;
        }
      }
      nextIndex++;
    }

    // All night subphases complete -> Day transition
    this.state.nightSubPhase = 'COMPLETED';
    this.transitionToDay();
  }

  private isNightSubPhaseActive(subPhase: NightSubPhase): boolean {
    const alivePlayers = this.getAlivePlayers();

    switch (subPhase) {
      case 'CUPID':
        // Cupid only acts on night 1 and if alive and lovers not yet paired
        return (
          this.state.dayNumber === 1 &&
          alivePlayers.some((p) => p.role === 'CUPID') &&
          this.state.lovers === null
        );

      case 'BODYGUARD':
        return alivePlayers.some((p) => p.role === 'BODYGUARD');

      case 'WEREWOLF':
        return alivePlayers.some((p) => p.role === 'WEREWOLF');

      case 'WITCH': {
        const witchAlive = alivePlayers.some((p) => p.role === 'WITCH');
        const hasPotions =
          this.state.witchInventory.hasSavePotion || this.state.witchInventory.hasPoisonPotion;
        return witchAlive && hasPotions;
      }

      case 'SEER':
        return alivePlayers.some((p) => p.role === 'SEER');

      default:
        return false;
    }
  }

  private setNightSubPhase(subPhase: NightSubPhase, isActive: boolean = true): void {
    this.state.nightSubPhase = subPhase;
    const duration = isActive
      ? (this.state.settings.nightDuration || DEFAULT_TIMERS.NIGHT_SUBPHASE)
      : (this.isTestMode ? 0 : 2);

    this.setTimer(duration, () => {
      this.onNightSubPhaseTimeout();
    });

    switch (subPhase) {
      case 'CUPID':
        this.addLog('Thần Tình Yêu (Cupid) thức giấc để kết duyên cho đôi tình nhân...', 'INFO');
        break;
      case 'BODYGUARD':
        this.addLog('Bảo Vệ thức giấc để chọn một người che chở trong đêm...', 'INFO');
        break;
      case 'WEREWOLF':
        this.addLog('Ma Sói thức giấc, cùng nhau chọn nạn nhân xấu số...', 'INFO');
        break;
      case 'WITCH':
        this.addLog('Phù Thủy thức giấc, nhìn thấy nạn nhân và quyết định dùng độc dược...', 'INFO');
        break;
      case 'SEER':
        this.addLog('Tiên Tri thức giấc để soi thấu thân phận người chơi...', 'INFO');
        break;
    }

    this.notifyUpdate();
    if (isActive) {
      this.triggerBotNightActions(subPhase);
    }
  }

  private triggerBotNightActions(subPhase: NightSubPhase): void {
    const delay = this.isTestMode ? 0 : 3500;

    const scheduleAction = (fn: () => void) => {
      if (delay === 0) {
        fn();
      } else {
        const timeout = setTimeout(() => {
          if (this.state.phase === 'NIGHT' && this.state.nightSubPhase === subPhase) {
            fn();
          }
        }, delay);
        this.botTimeouts.push(timeout);
      }
    };

    switch (subPhase) {
      case 'CUPID': {
        const cupid = this.getAlivePlayers().find((p) => p.role === 'CUPID' && p.isBot);
        if (!cupid) return;

        scheduleAction(() => {
          const alive = this.getAlivePlayers();
          if (alive.length >= 2) {
            const shuffled = [...alive].sort(() => 0.5 - Math.random());
            this.handleNightAction({
              actorId: cupid.id,
              actionType: 'CUPID_CHOOSE',
              targetId: shuffled[0].id,
              secondTargetId: shuffled[1].id,
            });
          }
        });
        break;
      }

      case 'BODYGUARD': {
        const bodyguard = this.getAlivePlayers().find((p) => p.role === 'BODYGUARD' && p.isBot);
        if (!bodyguard) return;

        scheduleAction(() => {
          const eligible = this.getAlivePlayers().filter((p) => p.id !== this.lastProtectedPlayerId);
          if (eligible.length > 0) {
            const target = eligible[Math.floor(Math.random() * eligible.length)];
            this.handleNightAction({
              actorId: bodyguard.id,
              actionType: 'BODYGUARD_PROTECT',
              targetId: target.id,
            });
          }
        });
        break;
      }

      case 'WEREWOLF': {
        const wolfBots = this.getAlivePlayers().filter((p) => p.role === 'WEREWOLF' && p.isBot);
        if (wolfBots.length === 0) return;

        scheduleAction(() => {
          const nonWolves = this.getAlivePlayers().filter((p) => p.role !== 'WEREWOLF');
          const targets = nonWolves.length > 0 ? nonWolves : this.getAlivePlayers();
          if (targets.length === 0) return;

          const chosenTarget = targets[Math.floor(Math.random() * targets.length)];
          for (const bot of wolfBots) {
            this.handleNightAction({
              actorId: bot.id,
              actionType: 'WEREWOLF_KILL',
              targetId: chosenTarget.id,
            });
          }
        });
        break;
      }

      case 'WITCH': {
        const witch = this.getAlivePlayers().find((p) => p.role === 'WITCH' && p.isBot);
        if (!witch) return;

        scheduleAction(() => {
          if (this.state.nightVictims.wolfVictimId && this.state.witchInventory.hasSavePotion) {
            this.handleNightAction({
              actorId: witch.id,
              actionType: 'WITCH_SAVE',
            });
          }
          this.handleNightAction({
            actorId: witch.id,
            actionType: 'WITCH_SKIP',
          });
        });
        break;
      }

      case 'SEER': {
        const seer = this.getAlivePlayers().find((p) => p.role === 'SEER' && p.isBot);
        if (!seer) return;

        scheduleAction(() => {
          const others = this.getAlivePlayers().filter((p) => p.id !== seer.id);
          const pool = others.length > 0 ? others : this.getAlivePlayers();
          if (pool.length > 0) {
            const target = pool[Math.floor(Math.random() * pool.length)];
            this.handleNightAction({
              actorId: seer.id,
              actionType: 'SEER_CHECK',
              targetId: target.id,
            });
          }
        });
        break;
      }
    }
  }

  private onNightSubPhaseTimeout(): void {
    // If werewolves timed out, pick majority vote or random if tied
    if (this.state.nightSubPhase === 'WEREWOLF' && !this.state.nightVictims.wolfVictimId) {
      this.resolveWerewolfVotes();
    }
    this.advanceToNextNightSubPhase();
  }

  // ==========================================
  // NIGHT ACTIONS
  // ==========================================

  public handleNightAction(action: NightAction): {
    success: boolean;
    message?: string;
    seerResult?: SeerInspectionResult;
  } {
    if (this.state.phase !== 'NIGHT') {
      return { success: false, message: 'Chưa tới ban đêm để hành động' };
    }

    const actor = this.getPlayer(action.actorId);
    if (!actor || !actor.isAlive) {
      return { success: false, message: 'Người chơi không hợp lệ hoặc đã chết' };
    }

    switch (action.actionType) {
      case 'CUPID_CHOOSE': {
        if (this.state.nightSubPhase !== 'CUPID' || actor.role !== 'CUPID') {
          return { success: false, message: 'Không phải lượt của Cupid' };
        }
        if (!action.targetId || !action.secondTargetId || action.targetId === action.secondTargetId) {
          return { success: false, message: 'Cupid phải chọn 2 người chơi khác nhau' };
        }

        const lover1 = this.getPlayer(action.targetId);
        const lover2 = this.getPlayer(action.secondTargetId);
        if (!lover1 || !lover2 || !lover1.isAlive || !lover2.isAlive) {
          return { success: false, message: 'Cặp đôi được chọn phải còn sống' };
        }

        lover1.isLover = true;
        lover1.loverId = lover2.id;
        lover2.isLover = true;
        lover2.loverId = lover1.id;
        this.state.lovers = [lover1.id, lover2.id];

        this.addLog(`Cupid đã ghép đôi thành công cho 2 người chơi!`, 'INFO');
        this.advanceToNextNightSubPhase();
        return { success: true };
      }

      case 'BODYGUARD_PROTECT': {
        if (this.state.nightSubPhase !== 'BODYGUARD' || actor.role !== 'BODYGUARD') {
          return { success: false, message: 'Không phải lượt của Bảo Vệ' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Bảo Vệ phải chọn một người để bảo vệ' };
        }
        if (action.targetId === this.lastProtectedPlayerId) {
          return { success: false, message: 'Không thể bảo vệ cùng một người 2 đêm liên tiếp' };
        }

        const target = this.getPlayer(action.targetId);
        if (!target || !target.isAlive) {
          return { success: false, message: 'Người được bảo vệ phải còn sống' };
        }

        target.isProtected = true;
        this.lastProtectedPlayerId = target.id;
        actor.targetPlayerId = target.id;

        this.advanceToNextNightSubPhase();
        return { success: true };
      }

      case 'WEREWOLF_KILL': {
        if (this.state.nightSubPhase !== 'WEREWOLF' || actor.role !== 'WEREWOLF') {
          return { success: false, message: 'Không phải lượt của Ma Sói' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Sói phải chọn một mục tiêu' };
        }

        const target = this.getPlayer(action.targetId);
        if (!target || !target.isAlive) {
          return { success: false, message: 'Mục tiêu phải còn sống' };
        }

        this.werewolfVotes[actor.id] = target.id;
        actor.targetPlayerId = target.id;

        // Check if all alive wolves voted
        const aliveWolves = this.getAlivePlayers().filter((p) => p.role === 'WEREWOLF');
        const allVoted = aliveWolves.every((w) => this.werewolfVotes[w.id]);

        if (allVoted) {
          this.resolveWerewolfVotes();
          this.advanceToNextNightSubPhase();
        } else {
          this.notifyUpdate();
        }
        return { success: true };
      }

      case 'WITCH_SAVE': {
        if (this.state.nightSubPhase !== 'WITCH' || actor.role !== 'WITCH') {
          return { success: false, message: 'Không phải lượt của Phù Thủy' };
        }
        if (!this.state.witchInventory.hasSavePotion) {
          return { success: false, message: 'Đã hết bình thuốc cứu' };
        }
        if (!this.state.nightVictims.wolfVictimId) {
          return { success: false, message: 'Đêm nay không có nạn nhân bị sói cắn' };
        }

        this.state.witchInventory.hasSavePotion = false;
        this.state.nightVictims.savedVictimId = this.state.nightVictims.wolfVictimId;
        actor.targetPlayerId = this.state.nightVictims.wolfVictimId;
        this.notifyUpdate();
        return { success: true };
      }

      case 'WITCH_POISON': {
        if (this.state.nightSubPhase !== 'WITCH' || actor.role !== 'WITCH') {
          return { success: false, message: 'Không phải lượt của Phù Thủy' };
        }
        if (!this.state.witchInventory.hasPoisonPotion) {
          return { success: false, message: 'Đã hết bình thuốc độc' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Phải chọn người để đầu độc' };
        }

        const target = this.getPlayer(action.targetId);
        if (!target || !target.isAlive) {
          return { success: false, message: 'Người bị đầu độc phải còn sống' };
        }

        this.state.witchInventory.hasPoisonPotion = false;
        this.state.nightVictims.poisonVictimId = target.id;
        target.isPoisoned = true;
        this.notifyUpdate();
        return { success: true };
      }

      case 'WITCH_SKIP': {
        if (this.state.nightSubPhase !== 'WITCH' || actor.role !== 'WITCH') {
          return { success: false, message: 'Không phải lượt của Phù Thủy' };
        }
        this.advanceToNextNightSubPhase();
        return { success: true };
      }

      case 'SEER_CHECK': {
        if (this.state.nightSubPhase !== 'SEER' || actor.role !== 'SEER') {
          return { success: false, message: 'Không phải lượt của Tiên Tri' };
        }
        if (!action.targetId) {
          return { success: false, message: 'Tiên Tri phải chọn một mục tiêu để soi' };
        }

        const target = this.getPlayer(action.targetId);
        if (!target || !target.isAlive) {
          return { success: false, message: 'Mục tiêu phải còn sống' };
        }

        actor.targetPlayerId = target.id;
        const seerResult: SeerInspectionResult = {
          targetId: target.id,
          targetName: target.name,
          role: target.role!,
          team: getRoleTeam(target.role!),
          isEvil: isEvilRole(target.role!),
        };

        this.advanceToNextNightSubPhase();
        return { success: true, seerResult };
      }

      default:
        return { success: false, message: 'Hành động không được hỗ trợ' };
    }
  }

  private resolveWerewolfVotes(): void {
    const tally: Record<string, number> = {};
    for (const targetId of Object.values(this.werewolfVotes)) {
      tally[targetId] = (tally[targetId] || 0) + 1;
    }

    let topTarget: string | null = null;
    let maxVotes = 0;

    for (const [targetId, votes] of Object.entries(tally)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        topTarget = targetId;
      }
    }

    this.state.nightVictims.wolfVictimId = topTarget;
  }

  // ==========================================
  // TRANSITION TO DAY & CASUALTIES
  // ==========================================

  public transitionToDay(): void {
    this.clearTimer();
    const deaths: DeathAnnouncement[] = [];
    const deadIds = new Set<string>();

    const { wolfVictimId, savedVictimId, poisonVictimId } = this.state.nightVictims;

    // 1. Werewolf Victim
    if (wolfVictimId) {
      const victim = this.getPlayer(wolfVictimId);
      if (victim && victim.isAlive) {
        const isSaved = savedVictimId === wolfVictimId;
        const isProtected = victim.isProtected;

        if (!isSaved && !isProtected) {
          deadIds.add(wolfVictimId);
          deaths.push({
            playerId: victim.id,
            playerName: victim.name,
            role: victim.role,
            reason: 'Bị Ma Sói cắn xé dã man trong đêm',
          });
        }
      }
    }

    // 2. Witch Poison Victim
    if (poisonVictimId) {
      const victim = this.getPlayer(poisonVictimId);
      if (victim && victim.isAlive && !deadIds.has(poisonVictimId)) {
        deadIds.add(poisonVictimId);
        deaths.push({
          playerId: victim.id,
          playerName: victim.name,
          role: victim.role,
          reason: 'Bị trúng độc bí ẩn của Phù Thủy',
        });
      }
    }

    // 3. Lovers Grief Cascade
    if (this.state.lovers) {
      const [lover1Id, lover2Id] = this.state.lovers;
      const l1 = this.getPlayer(lover1Id);
      const l2 = this.getPlayer(lover2Id);

      if (deadIds.has(lover1Id) && l2 && l2.isAlive && !deadIds.has(lover2Id)) {
        deadIds.add(lover2Id);
        deaths.push({
          playerId: l2.id,
          playerName: l2.name,
          role: l2.role,
          reason: `Chết vì quá đau đớn khi người yêu (${l1?.name}) qua đời`,
        });
      } else if (deadIds.has(lover2Id) && l1 && l1.isAlive && !deadIds.has(lover1Id)) {
        deadIds.add(lover1Id);
        deaths.push({
          playerId: l1.id,
          playerName: l1.name,
          role: l1.role,
          reason: `Chết vì quá đau đớn khi người yêu (${l2?.name}) qua đời`,
        });
      }
    }

    // Apply deaths to player objects
    for (const death of deaths) {
      const p = this.getPlayer(death.playerId);
      if (p) {
        p.isAlive = false;
        p.deathReason = death.reason;
        p.deathPhase = 'NIGHT';
      }
    }

    this.state.nightVictims.deathIds = Array.from(deadIds);
    this.state.lastNightDeaths = deaths;

    // Log announcement
    if (deaths.length === 0) {
      this.addLog(`Trời đã sáng! Một đêm yên bình, không ai phải bỏ mạng.`, 'DEATH');
    } else {
      const names = deaths.map((d) => d.playerName).join(', ');
      this.addLog(`Trời đã sáng! Đêm qua có ${deaths.length} người ngã xuống: ${names}`, 'DEATH');
    }

    // Check if Hunter was killed -> Trigger Hunter revenge shot!
    const killedHunter = deaths.find((d) => d.role === 'HUNTER');
    if (killedHunter) {
      this.triggerHunterShot(killedHunter.playerId, killedHunter.playerName);
    }

    // Check Win Condition
    if (this.checkWinCondition()) {
      return;
    }

    // Start Discussion Phase
    this.startDayDiscussion();
  }

  private triggerHunterShot(hunterId: string, hunterName: string): void {
    this.state.hunterPending = {
      hunterId,
      hunterName,
      timer: DEFAULT_TIMERS.HUNTER,
    };
    this.addLog(`Thợ Săn ${hunterName} bị hạ gục và kích hoạt phát súng trả thù cuối cùng!`, 'INFO');

    const hunter = this.getPlayer(hunterId);
    if (hunter && hunter.isBot) {
      const delay = this.isTestMode ? 0 : 1000;
      const shoot = () => {
        const alive = this.getAlivePlayers().filter((p) => p.id !== hunterId);
        if (alive.length > 0) {
          const target = alive[Math.floor(Math.random() * alive.length)];
          this.handleHunterShoot(hunterId, target.id);
        }
      };

      if (delay === 0) {
        shoot();
      } else {
        const timeout = setTimeout(shoot, delay);
        this.botTimeouts.push(timeout);
      }
    }
  }

  public handleHunterShoot(hunterId: string, targetId: string): { success: boolean; message?: string } {
    if (!this.state.hunterPending || this.state.hunterPending.hunterId !== hunterId) {
      return { success: false, message: 'Không có phát súng thợ săn đang chờ' };
    }

    const target = this.getPlayer(targetId);
    if (!target || !target.isAlive) {
      return { success: false, message: 'Mục tiêu của thợ săn phải còn sống' };
    }

    target.isAlive = false;
    target.deathReason = 'Bị Thợ Săn bắn hạ trước khi chết';
    target.deathPhase = this.state.phase;

    this.addLog(
      `Thợ Săn đã nổ súng bắn chết ${target.name} trước khi trút hơi thở cuối!`,
      'DEATH'
    );

    // Lover grief check for hunter shot target
    if (this.state.lovers && this.state.lovers.includes(target.id)) {
      const otherId = this.state.lovers.find((id) => id !== target.id);
      const other = otherId ? this.getPlayer(otherId) : null;
      if (other && other.isAlive) {
        other.isAlive = false;
        other.deathReason = `Chết vì đau lòng khi người yêu (${target.name}) bị Thợ Săn bắn`;
        this.addLog(`${other.name} chết theo người yêu vì quá đau buồn!`, 'DEATH');
      }
    }

    this.state.hunterPending = null;
    this.checkWinCondition();
    this.notifyUpdate();
    return { success: true };
  }

  // ==========================================
  // DAY DISCUSSION & VOTING
  // ==========================================

  public startDayDiscussion(): void {
    this.state.phase = 'DAY_DISCUSSION';
    const duration = this.state.settings.discussionDuration || DEFAULT_TIMERS.DISCUSSION;
    this.setTimer(duration, () => {
      this.startDayVoting();
    });

    this.addLog(
      `Bắt đầu thời gian thảo luận ban ngày (${duration}s). Dân làng hãy bàn bạc tìm ra Ma Sói!`,
      'INFO'
    );
    this.notifyUpdate();
  }

  public startDayVoting(): void {
    this.state.phase = 'DAY_VOTING';
    this.state.votes = {};
    this.state.players.forEach((p) => (p.votesReceived = 0));

    const duration = this.state.settings.votingDuration || DEFAULT_TIMERS.VOTING;
    this.setTimer(duration, () => {
      this.tallyVotesAndExecute();
    });

    this.addLog(
      `Bắt đầu bỏ phiếu treo cổ (${duration}s)! Hãy chọn người bạn nghi ngờ nhất.`,
      'VOTE'
    );
    this.notifyUpdate();
    this.triggerBotVoting();
  }

  private triggerBotVoting(): void {
    const aliveBotPlayers = this.getAlivePlayers().filter((p) => p.isBot);
    if (aliveBotPlayers.length === 0) return;

    const delay = this.isTestMode ? 0 : 2000;

    aliveBotPlayers.forEach((bot, index) => {
      const staggeredDelay = delay + (this.isTestMode ? 0 : index * 400);
      const action = () => {
        if (this.state.phase !== 'DAY_VOTING' || !bot.isAlive) return;

        const aliveOthers = this.getAlivePlayers().filter((p) => p.id !== bot.id);
        const candidatePool = aliveOthers.length > 0 ? aliveOthers : this.getAlivePlayers();
        if (candidatePool.length > 0) {
          const target = candidatePool[Math.floor(Math.random() * candidatePool.length)];
          this.castVote(bot.id, target.id);
        }
      };

      if (staggeredDelay === 0) {
        action();
      } else {
        const timeout = setTimeout(action, staggeredDelay);
        this.botTimeouts.push(timeout);
      }
    });
  }

  public castVote(voterId: string, targetId: string | null): { success: boolean; message?: string } {
    if (this.state.phase !== 'DAY_VOTING') {
      return { success: false, message: 'Chưa tới lượt bỏ phiếu ban ngày' };
    }

    const voter = this.getPlayer(voterId);
    if (!voter || !voter.isAlive) {
      return { success: false, message: 'Chỉ người chơi còn sống mới được bỏ phiếu' };
    }

    if (targetId) {
      const target = this.getPlayer(targetId);
      if (!target || !target.isAlive) {
        return { success: false, message: 'Không thể bỏ phiếu cho người đã chết' };
      }
    }

    this.state.votes[voterId] = targetId;

    // Recalculate votes received
    this.recalculateVoteTally();

    // Check if all alive players have voted
    const alivePlayers = this.getAlivePlayers();
    const allVoted = alivePlayers.every((p) => this.state.votes[p.id] !== undefined);

    if (allVoted) {
      this.tallyVotesAndExecute();
    } else {
      this.notifyUpdate();
    }

    return { success: true };
  }

  private recalculateVoteTally(): void {
    // Reset votes received
    this.state.players.forEach((p) => (p.votesReceived = 0));

    for (const [voterId, targetId] of Object.entries(this.state.votes)) {
      if (!targetId) continue;
      const target = this.getPlayer(targetId);
      const voter = this.getPlayer(voterId);
      if (target && voter && voter.isAlive) {
        // Mayor vote counts as 2 votes
        const voteWeight = voter.isMayor ? 2 : 1;
        target.votesReceived += voteWeight;
      }
    }
  }

  public tallyVotesAndExecute(): void {
    this.clearTimer();
    this.recalculateVoteTally();

    const alivePlayers = this.getAlivePlayers();
    let highestVotes = 0;
    let candidatesWithMaxVotes: Player[] = [];

    for (const player of alivePlayers) {
      if (player.votesReceived > highestVotes) {
        highestVotes = player.votesReceived;
        candidatesWithMaxVotes = [player];
      } else if (player.votesReceived === highestVotes && highestVotes > 0) {
        candidatesWithMaxVotes.push(player);
      }
    }

    if (highestVotes === 0 || candidatesWithMaxVotes.length === 0) {
      this.addLog('Không có phiếu bầu nào được ghi nhận. Không ai bị xử tử.', 'VOTE');
    } else if (candidatesWithMaxVotes.length > 1) {
      const names = candidatesWithMaxVotes.map((p) => p.name).join(', ');
      this.addLog(
        `Số phiếu hòa (${highestVotes} phiếu) giữa: ${names}. Không ai bị xử tử hôm nay!`,
        'VOTE'
      );
    } else {
      const executed = candidatesWithMaxVotes[0];
      executed.isAlive = false;
      executed.deathReason = 'Bị dân làng biểu quyết treo cổ';
      executed.deathPhase = 'DAY_VOTING';

      this.addLog(
        `${executed.name} nhận nhiều phiếu nhất (${highestVotes} phiếu) và đã bị treo cổ!`,
        'VOTE'
      );

      // Check if executed was Hunter
      if (executed.role === 'HUNTER') {
        this.triggerHunterShot(executed.id, executed.name);
      }

      // Check if executed was Lover
      if (this.state.lovers && this.state.lovers.includes(executed.id)) {
        const otherId = this.state.lovers.find((id) => id !== executed.id);
        const other = otherId ? this.getPlayer(otherId) : null;
        if (other && other.isAlive) {
          other.isAlive = false;
          other.deathReason = `Chết vì đau lòng khi người yêu (${executed.name}) bị treo cổ`;
          this.addLog(`${other.name} cũng đã chết theo người yêu vì quá đau lòng!`, 'DEATH');
        }
      }
    }

    if (this.checkWinCondition()) {
      return;
    }

    // Continue to next night
    this.state.dayNumber += 1;
    this.startNight();
  }

  // ==========================================
  // MAYOR MECHANICS
  // ==========================================

  public setMayor(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (!player || !player.isAlive) return;

    this.state.players.forEach((p) => (p.isMayor = false));
    player.isMayor = true;
    this.addLog(`${player.name} đã trở thành Thị Trưởng của ngôi làng!`, 'INFO');
    this.notifyUpdate();
  }

  public passMayor(fromPlayerId: string, toPlayerId: string): boolean {
    const from = this.getPlayer(fromPlayerId);
    const to = this.getPlayer(toPlayerId);
    if (!from || !from.isMayor || !to || !to.isAlive) return false;

    from.isMayor = false;
    to.isMayor = true;
    this.addLog(`Thị Trưởng ${from.name} đã trao lại huy hiệu Thị Trưởng cho ${to.name}!`, 'INFO');
    this.notifyUpdate();
    return true;
  }

  // ==========================================
  // WIN CONDITION CHECK
  // ==========================================

  public checkWinCondition(): Team | 'LOVERS' | null {
    const alivePlayers = this.getAlivePlayers();

    // 1. Lovers win condition:
    // Lovers are both alive and are the ONLY survivors!
    if (this.state.lovers) {
      const [l1Id, l2Id] = this.state.lovers;
      const l1 = this.getPlayer(l1Id);
      const l2 = this.getPlayer(l2Id);

      if (l1 && l1.isAlive && l2 && l2.isAlive && alivePlayers.length === 2) {
        this.setGameOver('LOVERS', VICTORY_MESSAGES.LOVERS);
        return 'LOVERS';
      }
    }

    const aliveWolves = alivePlayers.filter((p) => p.role === 'WEREWOLF').length;
    const aliveVillagers = alivePlayers.length - aliveWolves;

    // 2. Villagers win condition: All Werewolves dead
    if (aliveWolves === 0) {
      this.setGameOver('VILLAGE', VICTORY_MESSAGES.VILLAGE);
      return 'VILLAGE';
    }

    // 3. Werewolves win condition: Werewolves equal or exceed Villagers
    if (aliveWolves >= aliveVillagers && aliveWolves > 0) {
      this.setGameOver('WEREWOLF', VICTORY_MESSAGES.WEREWOLF);
      return 'WEREWOLF';
    }

    return null;
  }

  private setGameOver(winner: Team | 'LOVERS', reason: string): void {
    this.clearTimer();
    this.state.phase = 'GAME_OVER';
    this.state.winner = winner;
    this.state.winReason = reason;
    this.addLog(`TRÒ CHƠI KẾT THÚC! ${reason}`, 'WIN');
    this.notifyUpdate();
  }

  public restartGame(): void {
    this.clearTimer();
    this.state.phase = 'LOBBY';
    this.state.nightSubPhase = null;
    this.state.dayNumber = 0;
    this.state.timer = 0;
    this.state.totalTime = 0;
    this.state.winner = null;
    this.state.winReason = null;
    this.state.votes = {};
    this.state.lovers = null;
    this.state.hunterPending = null;
    this.state.lastNightDeaths = [];
    this.state.witchInventory = { hasSavePotion: true, hasPoisonPotion: true };

    this.state.players.forEach((p) => {
      p.role = null;
      p.isAlive = true;
      p.isMayor = false;
      p.isProtected = false;
      p.isPoisoned = false;
      p.isLover = false;
      p.loverId = null;
      p.votesReceived = 0;
      p.deathReason = null;
      p.deathPhase = null;
      p.targetPlayerId = null;
    });

    this.addLog('Phòng chơi đã được cài lại về trạng thái chờ!', 'INFO');
    this.notifyUpdate();
  }

  // ==========================================
  // CHAT MESSAGES
  // ==========================================

  public addChatMessage(
    senderId: string,
    channel: 'ALL' | 'WEREWOLF' | 'SYSTEM',
    content: string
  ): ChatMessage | null {
    const sender = this.getPlayer(senderId);
    if (!sender) return null;

    if (channel === 'WEREWOLF') {
      if (sender.role !== 'WEREWOLF') return null;
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: sender.id,
      senderName: sender.name,
      channel,
      content,
      timestamp: Date.now(),
      roleBadge: channel === 'WEREWOLF' ? 'WEREWOLF' : undefined,
    };

    this.state.messages.push(message);
    return message;
  }

  // ==========================================
  // CLIENT STATE MASKING (ANTI-CHEAT)
  // ==========================================

  public getClientState(forPlayerId?: string): RoomState {
    const viewer = forPlayerId ? this.getPlayer(forPlayerId) : undefined;
    const isGameOver = this.state.phase === 'GAME_OVER';

    // Deep clone state structure
    const clientPlayers: Player[] = this.state.players.map((p) => {
      const isSelf = p.id === forPlayerId;
      const isFellowWolf =
        viewer?.role === 'WEREWOLF' && p.role === 'WEREWOLF' && viewer.isAlive;
      const isLoverWithViewer =
        viewer?.isLover && p.isLover && viewer.loverId === p.id;
      const isCupidViewingLovers = viewer?.role === 'CUPID' && p.isLover;

      const shouldRevealRole = isGameOver || isSelf || isFellowWolf;
      const shouldRevealLover =
        isGameOver || isSelf || isLoverWithViewer || isCupidViewingLovers;

      return {
        ...p,
        role: shouldRevealRole ? p.role : null,
        isLover: shouldRevealLover ? p.isLover : false,
        loverId: isSelf || isGameOver ? p.loverId : null,
        // Hide protection and poison flags from other players during night
        isProtected: isSelf || isGameOver ? p.isProtected : false,
        isPoisoned: isSelf || isGameOver ? p.isPoisoned : false,
        targetPlayerId: isSelf || isGameOver ? p.targetPlayerId : null,
      };
    });

    // Mask witch inventory
    const witchInventory =
      viewer?.role === 'WITCH' || isGameOver
        ? this.state.witchInventory
        : { hasSavePotion: false, hasPoisonPotion: false };

    // Mask night victims
    const isWolf = viewer?.role === 'WEREWOLF';
    const isWitch = viewer?.role === 'WITCH';
    const nightVictims =
      isGameOver || this.state.phase !== 'NIGHT'
        ? this.state.nightVictims
        : {
            wolfVictimId: isWolf || isWitch ? this.state.nightVictims.wolfVictimId : null,
            poisonVictimId: isWitch ? this.state.nightVictims.poisonVictimId : null,
            savedVictimId: isWitch ? this.state.nightVictims.savedVictimId : null,
            deathIds: [],
          };

    // Mask werewolf chat messages
    const filteredMessages = this.state.messages.filter((m) => {
      if (m.channel === 'WEREWOLF') {
        return viewer?.role === 'WEREWOLF' || isGameOver;
      }
      return true;
    });

    // Mask lovers array
    const canSeeLovers =
      isGameOver ||
      viewer?.role === 'CUPID' ||
      (viewer && this.state.lovers?.includes(viewer.id));

    // Mask dead players' roles in lastNightDeaths
    const maskedDeaths = this.state.lastNightDeaths.map((d) => ({
      ...d,
      role: isGameOver || d.playerId === forPlayerId ? d.role : null,
    }));

    return {
      ...this.state,
      players: clientPlayers,
      witchInventory,
      nightVictims,
      lovers: canSeeLovers ? this.state.lovers : null,
      messages: filteredMessages,
      lastNightDeaths: maskedDeaths,
    };
  }

  // ==========================================
  // TIMERS & LOGS
  // ==========================================

  public setTimer(seconds: number, onExpire: () => void): void {
    this.clearTimer();
    this.state.timer = seconds;
    this.state.totalTime = seconds;

    this.timerInterval = setInterval(() => {
      this.tick(onExpire);
    }, 1000);
  }

  public tick(onExpire?: () => void): void {
    if (this.state.timer > 0) {
      this.state.timer -= 1;
      this.notifyUpdate();

      if (this.state.timer <= 0) {
        this.clearTimer();
        if (onExpire) {
          onExpire();
        }
      }
    }
  }

  public clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.botTimeouts.forEach((t) => clearTimeout(t));
    this.botTimeouts = [];
  }

  private addLog(
    message: string,
    type: 'INFO' | 'DEATH' | 'VOTE' | 'NIGHT_RESULT' | 'WIN' = 'INFO'
  ): void {
    const log: GameLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      day: this.state.dayNumber,
      phase: this.state.phase,
      message,
      timestamp: Date.now(),
      type,
    };
    this.state.logs.push(log);
  }

  private notifyUpdate(): void {
    if (this.onStateUpdate) {
      this.onStateUpdate(this.state);
    }
  }
}
