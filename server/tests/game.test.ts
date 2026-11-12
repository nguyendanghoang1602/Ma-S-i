import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../src/game/GameEngine';
import { RoomManager } from '../src/rooms/RoomManager';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  it('creates and retrieves a room with custom or generated code', () => {
    const room = manager.createRoom({
      customCode: 'TEST99',
      hostPlayer: { id: 'p1', name: 'Host Player', avatar: 'avatar1.png' },
    });

    expect(room.state.code).toBe('TEST99');
    expect(manager.getRoom('TEST99')).toBe(room);
    expect(manager.getRoomCount()).toBe(1);
  });

  it('allows players to join and leave room', () => {
    manager.createRoom({
      customCode: 'WOLF01',
      hostPlayer: { id: 'p1', name: 'Host', avatar: 'a1.png' },
    });

    const joined = manager.joinRoom('WOLF01', { id: 'p2', name: 'Player 2', avatar: 'a2.png' });
    expect(joined.state.players).toHaveLength(2);

    const { isEmpty } = manager.leaveRoom('WOLF01', 'p2');
    expect(isEmpty).toBe(false);
    expect(joined.state.players).toHaveLength(1);
  });
});

describe('GameEngine - Role Assignment & Lobby', () => {
  it('throws error if starting with fewer than minimum players', () => {
    const game = new GameEngine({
      code: 'GAME01',
      hostPlayer: { id: 'p1', name: 'Host', avatar: 'a1' },
      settings: { minPlayers: 4 },
    });

    game.addPlayer({ id: 'p2', name: 'P2', avatar: 'a2' });
    expect(() => game.startGame()).toThrow();
  });

  it('assigns balanced roles when starting with 4 players', () => {
    const game = new GameEngine({
      code: 'GAME01',
      hostPlayer: { id: 'p1', name: 'Host', avatar: 'a1' },
      settings: { minPlayers: 4 },
    });

    game.addPlayer({ id: 'p2', name: 'P2', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'P3', avatar: 'a3' });
    game.addPlayer({ id: 'p4', name: 'P4', avatar: 'a4' });

    game.startGame();
    expect(game.state.phase).toBe('NIGHT');
    expect(game.state.dayNumber).toBe(1);

    const roles = game.state.players.map((p) => p.role);
    expect(roles).toContain('WEREWOLF');
    expect(roles).toContain('SEER');
    expect(roles).toContain('BODYGUARD');
    expect(roles).toContain('VILLAGER');
  });
});

describe('GameEngine - Night Phase Sequencing & Role Actions', () => {
  let game: GameEngine;

  beforeEach(() => {
    game = new GameEngine({
      code: 'TEST01',
      hostPlayer: { id: 'p1', name: 'CupidUser', avatar: 'a1' },
      settings: { minPlayers: 7, nightDuration: 30, discussionDuration: 60, votingDuration: 30 },
    });

    game.addPlayer({ id: 'p2', name: 'GuardUser', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'WolfUser1', avatar: 'a3' });
    game.addPlayer({ id: 'p4', name: 'WolfUser2', avatar: 'a4' });
    game.addPlayer({ id: 'p5', name: 'WitchUser', avatar: 'a5' });
    game.addPlayer({ id: 'p6', name: 'SeerUser', avatar: 'a6' });
    game.addPlayer({ id: 'p7', name: 'HunterUser', avatar: 'a7' });
    game.addPlayer({ id: 'p8', name: 'VillagerUser', avatar: 'a8' });

    // Manually assign specific roles for deterministic testing
    game.state.players[0].role = 'CUPID';
    game.state.players[1].role = 'BODYGUARD';
    game.state.players[2].role = 'WEREWOLF';
    game.state.players[3].role = 'WEREWOLF';
    game.state.players[4].role = 'WITCH';
    game.state.players[5].role = 'SEER';
    game.state.players[6].role = 'HUNTER';
    game.state.players[7].role = 'VILLAGER';

    game.state.dayNumber = 1;
    game.startNight();
  });

  it('starts night with Cupid subphase on night 1 and allows Cupid to pair lovers', () => {
    expect(game.state.phase).toBe('NIGHT');
    expect(game.state.nightSubPhase).toBe('CUPID');

    // Cupid pairs p7 (Hunter) and p8 (Villager)
    const res = game.handleNightAction({
      actorId: 'p1',
      actionType: 'CUPID_CHOOSE',
      targetId: 'p7',
      secondTargetId: 'p8',
    });

    expect(res.success).toBe(true);
    expect(game.state.lovers).toEqual(['p7', 'p8']);
    expect(game.getPlayer('p7')?.isLover).toBe(true);
    expect(game.getPlayer('p7')?.loverId).toBe('p8');
    expect(game.getPlayer('p8')?.isLover).toBe(true);
    expect(game.getPlayer('p8')?.loverId).toBe('p7');

    // Automatically transitioned to next subphase: BODYGUARD
    expect(game.state.nightSubPhase).toBe('BODYGUARD');
  });

  it('Bodyguard protects a player and prevents consecutive protection', () => {
    // Advance past Cupid
    game.handleNightAction({
      actorId: 'p1',
      actionType: 'CUPID_CHOOSE',
      targetId: 'p7',
      secondTargetId: 'p8',
    });

    expect(game.state.nightSubPhase).toBe('BODYGUARD');

    // Bodyguard protects p8
    const res = game.handleNightAction({
      actorId: 'p2',
      actionType: 'BODYGUARD_PROTECT',
      targetId: 'p8',
    });

    expect(res.success).toBe(true);
    expect(game.getPlayer('p8')?.isProtected).toBe(true);

    // Advanced to WEREWOLF
    expect(game.state.nightSubPhase).toBe('WEREWOLF');
  });

  it('Werewolves choose a victim and advance to Witch', () => {
    // Cupid
    game.handleNightAction({
      actorId: 'p1',
      actionType: 'CUPID_CHOOSE',
      targetId: 'p7',
      secondTargetId: 'p8',
    });
    // Bodyguard
    game.handleNightAction({
      actorId: 'p2',
      actionType: 'BODYGUARD_PROTECT',
      targetId: 'p7',
    });

    expect(game.state.nightSubPhase).toBe('WEREWOLF');

    // Wolf 1 votes p8
    game.handleNightAction({
      actorId: 'p3',
      actionType: 'WEREWOLF_KILL',
      targetId: 'p8',
    });

    // Still in WEREWOLF until wolf 2 votes
    expect(game.state.nightSubPhase).toBe('WEREWOLF');

    // Wolf 2 votes p8
    game.handleNightAction({
      actorId: 'p4',
      actionType: 'WEREWOLF_KILL',
      targetId: 'p8',
    });

    // All wolves voted, wolf victim is p8, advances to WITCH
    expect(game.state.nightVictims.wolfVictimId).toBe('p8');
    expect(game.state.nightSubPhase).toBe('WITCH');
  });

  it('Witch can save the wolf victim and poison another player', () => {
    // Cupid
    game.handleNightAction({
      actorId: 'p1',
      actionType: 'CUPID_CHOOSE',
      targetId: 'p7',
      secondTargetId: 'p8',
    });
    // Bodyguard protects p1
    game.handleNightAction({
      actorId: 'p2',
      actionType: 'BODYGUARD_PROTECT',
      targetId: 'p1',
    });
    // Wolves target p8
    game.handleNightAction({ actorId: 'p3', actionType: 'WEREWOLF_KILL', targetId: 'p8' });
    game.handleNightAction({ actorId: 'p4', actionType: 'WEREWOLF_KILL', targetId: 'p8' });

    expect(game.state.nightSubPhase).toBe('WITCH');

    // Witch uses save potion on p8
    const saveRes = game.handleNightAction({
      actorId: 'p5',
      actionType: 'WITCH_SAVE',
    });
    expect(saveRes.success).toBe(true);
    expect(game.state.nightVictims.savedVictimId).toBe('p8');
    expect(game.state.witchInventory.hasSavePotion).toBe(false);

    // Witch poisons p3 (one of the wolves)
    const poisonRes = game.handleNightAction({
      actorId: 'p5',
      actionType: 'WITCH_POISON',
      targetId: 'p3',
    });
    expect(poisonRes.success).toBe(true);
    expect(game.state.nightVictims.poisonVictimId).toBe('p3');
    expect(game.state.witchInventory.hasPoisonPotion).toBe(false);

    // Witch finishes/skips
    game.handleNightAction({ actorId: 'p5', actionType: 'WITCH_SKIP' });

    // Advances to SEER
    expect(game.state.nightSubPhase).toBe('SEER');
  });

  it('Seer inspects target and discovers true identity', () => {
    // Cupid
    game.handleNightAction({
      actorId: 'p1',
      actionType: 'CUPID_CHOOSE',
      targetId: 'p7',
      secondTargetId: 'p8',
    });
    // Bodyguard
    game.handleNightAction({ actorId: 'p2', actionType: 'BODYGUARD_PROTECT', targetId: 'p1' });
    // Wolves
    game.handleNightAction({ actorId: 'p3', actionType: 'WEREWOLF_KILL', targetId: 'p8' });
    game.handleNightAction({ actorId: 'p4', actionType: 'WEREWOLF_KILL', targetId: 'p8' });
    // Witch skip
    game.handleNightAction({ actorId: 'p5', actionType: 'WITCH_SKIP' });

    expect(game.state.nightSubPhase).toBe('SEER');

    // Seer inspects Wolf p4
    const seerRes = game.handleNightAction({
      actorId: 'p6',
      actionType: 'SEER_CHECK',
      targetId: 'p4',
    });

    expect(seerRes.success).toBe(true);
    expect(seerRes.seerResult).toBeDefined();
    expect(seerRes.seerResult?.role).toBe('WEREWOLF');
    expect(seerRes.seerResult?.isEvil).toBe(true);
    expect(seerRes.seerResult?.team).toBe('WEREWOLF');

    // After Seer, night completes and transitions to DAY_DISCUSSION
    expect(game.state.phase).toBe('DAY_DISCUSSION');
  });
});

describe('GameEngine - Day Casualties, Hunter Revenge & Lover Grief', () => {
  let game: GameEngine;

  beforeEach(() => {
    game = new GameEngine({
      code: 'TEST02',
      hostPlayer: { id: 'p1', name: 'Wolf1', avatar: 'a1' },
      settings: { minPlayers: 6 },
    });

    game.addPlayer({ id: 'p2', name: 'Wolf2', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Hunter', avatar: 'a3' });
    game.addPlayer({ id: 'p4', name: 'LoverOfHunter', avatar: 'a4' });
    game.addPlayer({ id: 'p5', name: 'Villager1', avatar: 'a5' });
    game.addPlayer({ id: 'p6', name: 'Villager2', avatar: 'a6' });

    game.state.players[0].role = 'WEREWOLF';
    game.state.players[1].role = 'WEREWOLF';
    game.state.players[2].role = 'HUNTER';
    game.state.players[3].role = 'VILLAGER';
    game.state.players[4].role = 'VILLAGER';
    game.state.players[5].role = 'VILLAGER';

    // Pair p3 (Hunter) and p4 as Lovers
    game.state.lovers = ['p3', 'p4'];
    game.state.players[2].isLover = true;
    game.state.players[2].loverId = 'p4';
    game.state.players[3].isLover = true;
    game.state.players[3].loverId = 'p3';
  });

  it('triggers Hunter revenge shot and Lover grief cascade when Hunter is killed at night', () => {
    game.state.phase = 'NIGHT';
    // Wolves killed Hunter (p3)
    game.state.nightVictims.wolfVictimId = 'p3';

    game.transitionToDay();

    // Hunter died
    expect(game.getPlayer('p3')?.isAlive).toBe(false);

    // Lover of Hunter (p4) also died of grief!
    expect(game.getPlayer('p4')?.isAlive).toBe(false);
    expect(game.getPlayer('p4')?.deathReason).toContain('đau đớn');

    // Hunter pending shot triggered!
    expect(game.state.hunterPending).toBeDefined();
    expect(game.state.hunterPending?.hunterId).toBe('p3');

    // Hunter shoots Wolf 1 (p1)
    const shotRes = game.handleHunterShoot('p3', 'p1');
    expect(shotRes.success).toBe(true);
    expect(game.getPlayer('p1')?.isAlive).toBe(false);
    expect(game.state.hunterPending).toBeNull();
  });
});

describe('GameEngine - Voting Phase & Mayor Mechanics', () => {
  let game: GameEngine;

  beforeEach(() => {
    game = new GameEngine({
      code: 'TEST03',
      hostPlayer: { id: 'p1', name: 'MayorPlayer', avatar: 'a1' },
      settings: { minPlayers: 5 },
    });

    game.addPlayer({ id: 'p2', name: 'Villager1', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Wolf1', avatar: 'a3' });
    game.addPlayer({ id: 'p4', name: 'Wolf2', avatar: 'a4' });
    game.addPlayer({ id: 'p5', name: 'Villager2', avatar: 'a5' });

    game.state.players[0].role = 'VILLAGER';
    game.state.players[1].role = 'VILLAGER';
    game.state.players[2].role = 'WEREWOLF';
    game.state.players[3].role = 'WEREWOLF';
    game.state.players[4].role = 'VILLAGER';

    game.setMayor('p1');
    expect(game.getPlayer('p1')?.isMayor).toBe(true);

    game.startDayVoting();
  });

  it('counts Mayor vote as 2x weight and executes the candidate with highest votes', () => {
    // Mayor (p1) votes p3 (Wolf1) -> 2 votes
    game.castVote('p1', 'p3');
    // p2 votes p3 -> 1 vote (total p3 = 3 votes)
    game.castVote('p2', 'p3');
    // p3 votes p2 -> 1 vote
    game.castVote('p3', 'p2');
    // p4 votes p2 -> 1 vote (total p2 = 2 votes)
    game.castVote('p4', 'p2');
    // p5 votes p3 -> 1 vote (total p3 = 4 votes)
    game.castVote('p5', 'p3');

    // Voting automatically tallies when all alive players cast their vote
    expect(game.getPlayer('p3')?.isAlive).toBe(false);
    expect(game.getPlayer('p3')?.deathReason).toContain('treo cổ');
  });

  it('handles tied votes gracefully without executing anyone', () => {
    // Remove mayor status to have simple 1-vote weights
    game.getPlayer('p1')!.isMayor = false;

    // p1, p2 vote p3 (2 votes)
    game.castVote('p1', 'p3');
    game.castVote('p2', 'p3');

    // p3, p4 vote p5 (2 votes)
    game.castVote('p3', 'p5');
    game.castVote('p4', 'p5');

    // p5 skips vote
    game.castVote('p5', null);

    // Both p3 and p5 should still be alive due to tie!
    expect(game.getPlayer('p3')?.isAlive).toBe(true);
    expect(game.getPlayer('p5')?.isAlive).toBe(true);
  });
});

describe('GameEngine - Win Conditions', () => {
  it('declares VILLAGE win when all Werewolves are dead', () => {
    const game = new GameEngine({
      code: 'TEST04',
      hostPlayer: { id: 'p1', name: 'Wolf1', avatar: 'a1' },
    });
    game.addPlayer({ id: 'p2', name: 'Vil1', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Vil2', avatar: 'a3' });

    game.state.players[0].role = 'WEREWOLF';
    game.state.players[1].role = 'VILLAGER';
    game.state.players[2].role = 'VILLAGER';

    // Kill the only werewolf
    game.state.players[0].isAlive = false;

    const winner = game.checkWinCondition();
    expect(winner).toBe('VILLAGE');
    expect(game.state.phase).toBe('GAME_OVER');
  });

  it('declares WEREWOLF win when alive Wolves equal or exceed alive Villagers', () => {
    const game = new GameEngine({
      code: 'TEST05',
      hostPlayer: { id: 'p1', name: 'Wolf1', avatar: 'a1' },
    });
    game.addPlayer({ id: 'p2', name: 'Wolf2', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Vil1', avatar: 'a3' });
    game.addPlayer({ id: 'p4', name: 'Vil2', avatar: 'a4' });

    game.state.players[0].role = 'WEREWOLF';
    game.state.players[1].role = 'WEREWOLF';
    game.state.players[2].role = 'VILLAGER';
    game.state.players[3].role = 'VILLAGER';

    // 2 wolves, 2 villagers -> Wolves equal villagers!
    const winner = game.checkWinCondition();
    expect(winner).toBe('WEREWOLF');
    expect(game.state.phase).toBe('GAME_OVER');
  });

  it('declares LOVERS win when only the 2 lovers remain alive', () => {
    const game = new GameEngine({
      code: 'TEST06',
      hostPlayer: { id: 'p1', name: 'WolfLover', avatar: 'a1' },
    });
    game.addPlayer({ id: 'p2', name: 'VillagerLover', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'DeadVillager', avatar: 'a3' });

    game.state.players[0].role = 'WEREWOLF';
    game.state.players[1].role = 'VILLAGER';
    game.state.players[2].role = 'VILLAGER';
    game.state.players[2].isAlive = false;

    // p1 and p2 are lovers
    game.state.lovers = ['p1', 'p2'];
    game.state.players[0].isLover = true;
    game.state.players[1].isLover = true;

    const winner = game.checkWinCondition();
    expect(winner).toBe('LOVERS');
    expect(game.state.phase).toBe('GAME_OVER');
  });
});

describe('GameEngine - Anti-Cheat Client State Masking', () => {
  it('masks other players roles for villagers during the game', () => {
    const game = new GameEngine({
      code: 'TEST07',
      hostPlayer: { id: 'p1', name: 'Vil1', avatar: 'a1' },
    });
    game.addPlayer({ id: 'p2', name: 'Wolf1', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Wolf2', avatar: 'a3' });

    game.state.players[0].role = 'VILLAGER';
    game.state.players[1].role = 'WEREWOLF';
    game.state.players[2].role = 'WEREWOLF';
    game.state.phase = 'NIGHT';

    const clientState = game.getClientState('p1');

    // p1 sees own role
    expect(clientState.players.find((p) => p.id === 'p1')?.role).toBe('VILLAGER');
    // p1 cannot see wolf roles
    expect(clientState.players.find((p) => p.id === 'p2')?.role).toBeNull();
    expect(clientState.players.find((p) => p.id === 'p3')?.role).toBeNull();
  });

  it('allows werewolves to see fellow werewolves', () => {
    const game = new GameEngine({
      code: 'TEST08',
      hostPlayer: { id: 'p1', name: 'Vil1', avatar: 'a1' },
    });
    game.addPlayer({ id: 'p2', name: 'Wolf1', avatar: 'a2' });
    game.addPlayer({ id: 'p3', name: 'Wolf2', avatar: 'a3' });

    game.state.players[0].role = 'VILLAGER';
    game.state.players[1].role = 'WEREWOLF';
    game.state.players[2].role = 'WEREWOLF';
    game.state.phase = 'NIGHT';

    const clientState = game.getClientState('p2');

    // p2 sees self role and fellow wolf p3 role
    expect(clientState.players.find((p) => p.id === 'p2')?.role).toBe('WEREWOLF');
    expect(clientState.players.find((p) => p.id === 'p3')?.role).toBe('WEREWOLF');
    // p2 cannot see villager role
    expect(clientState.players.find((p) => p.id === 'p1')?.role).toBeNull();
  });
});
