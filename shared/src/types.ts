/**
 * Core types and interfaces for Werewolf (Ma Sói) Game
 */

export type RoleType =
  | 'WEREWOLF'
  | 'VILLAGER'
  | 'SEER'
  | 'BODYGUARD'
  | 'WITCH'
  | 'HUNTER'
  | 'CUPID';

export type Team = 'VILLAGE' | 'WEREWOLF' | 'SOLO' | 'COUPLE';

export type PhaseType =
  | 'LOBBY'
  | 'NIGHT'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'GAME_OVER';

export type NightSubPhase =
  | 'CUPID'
  | 'BODYGUARD'
  | 'WEREWOLF'
  | 'WITCH'
  | 'SEER'
  | 'COMPLETED';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: RoleType | null;
  isAlive: boolean;
  isHost: boolean;
  isMayor: boolean;
  isProtected: boolean;
  isPoisoned: boolean;
  isLover: boolean;
  votesReceived: number;
  isBot?: boolean;

  // Additional helper fields
  loverId?: string | null;
  isReady?: boolean;
  connected?: boolean;
  targetPlayerId?: string | null;
  deathReason?: string | null;
  deathPhase?: string | null;
}

export type NightActionType =
  | 'CUPID_CHOOSE'
  | 'BODYGUARD_PROTECT'
  | 'WEREWOLF_KILL'
  | 'WITCH_SAVE'
  | 'WITCH_POISON'
  | 'WITCH_SKIP'
  | 'SEER_CHECK';

export interface NightAction {
  actorId: string;
  actionType: NightActionType;
  targetId?: string | null;
  secondTargetId?: string | null;
}

export interface VoteRecord {
  voterId: string;
  targetId: string | null; // null = skip / abstain
}

export type ChatChannel = 'ALL' | 'WEREWOLF' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  channel: ChatChannel;
  content: string;
  timestamp: number;
  isSystem?: boolean;
  roleBadge?: RoleType | null;
}

export interface WitchInventory {
  hasSavePotion: boolean;
  hasPoisonPotion: boolean;
}

export interface HunterPendingShot {
  hunterId: string;
  hunterName: string;
  timer: number;
}

export interface DeathAnnouncement {
  playerId: string;
  playerName: string;
  role?: RoleType | null;
  reason: string;
}

export interface GameLog {
  id: string;
  day: number;
  phase: PhaseType;
  message: string;
  timestamp: number;
  type?: 'INFO' | 'DEATH' | 'VOTE' | 'NIGHT_RESULT' | 'WIN';
}

export interface GameSettings {
  nightDuration: number;       // in seconds
  discussionDuration: number;  // in seconds
  votingDuration: number;      // in seconds
  minPlayers: number;
  enableMayor: boolean;
  rolesCount?: Partial<Record<RoleType, number>>;
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: PhaseType;
  nightSubPhase?: NightSubPhase | null;
  dayNumber: number;
  timer: number;
  totalTime: number;
  players: Player[];
  winner: Team | 'LOVERS' | null;
  winReason?: string | null;
  votes: Record<string, string | null>; // voterId -> targetId
  nightVictims: {
    wolfVictimId: string | null;
    poisonVictimId: string | null;
    savedVictimId: string | null;
    deathIds: string[];
  };
  lastNightDeaths: DeathAnnouncement[];
  lovers: [string, string] | null;
  witchInventory: WitchInventory;
  hunterPending: HunterPendingShot | null;
  messages: ChatMessage[];
  logs: GameLog[];
  settings: GameSettings;
}

export interface SeerInspectionResult {
  targetId: string;
  targetName: string;
  role: RoleType;
  team: Team;
  isEvil: boolean;
}

export interface SocketJoinRoomPayload {
  roomCode: string;
  playerName: string;
  avatar: string;
}

export interface SocketChatPayload {
  channel: ChatChannel;
  content: string;
}

export interface SocketNightActionPayload {
  actionType: NightActionType;
  targetId?: string | null;
  secondTargetId?: string | null;
}

export interface SocketVotePayload {
  targetId: string | null;
}

export interface SocketHunterShotPayload {
  targetId: string;
}

export interface SocketAddBotPayload {
  name?: string;
}

export interface SocketRemoveBotPayload {
  botId: string;
}


