/**
 * Global game constants, default timers, socket events, and configurations.
 */

import { RoleType } from './types';

/**
 * Default timers in seconds as required:
 * Night: 30s, Discussion: 60s, Voting: 30s
 */
export const DEFAULT_TIMERS = {
  NIGHT: 30,
  DISCUSSION: 60,
  VOTING: 30,
  HUNTER: 15,
  MAYOR_ELECTION: 30,
} as const;

/**
 * Player bounds
 */
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 16;

/**
 * Shared Socket.IO event names
 */
export const SOCKET_EVENTS = {
  // Client -> Server events
  JOIN_ROOM: 'room:join',
  LEAVE_ROOM: 'room:leave',
  START_GAME: 'game:start',
  SEND_CHAT: 'chat:send',
  NIGHT_ACTION: 'night:action',
  CAST_VOTE: 'vote:cast',
  HUNTER_SHOT: 'hunter:shoot',
  RESTART_GAME: 'game:restart',
  ADD_BOT: 'game:add_bot',
  REMOVE_BOT: 'game:remove_bot',

  // Server -> Client events
  ROOM_STATE: 'room:state',
  ERROR: 'room:error',
  CHAT_MESSAGE: 'chat:message',
  SEER_RESULT: 'seer:result',
  GAME_EVENT: 'game:event',
} as const;

/**
 * Recommended balanced role distributions per player count
 */
export const RECOMMENDED_ROLE_CONFIGS: Record<number, RoleType[]> = {
  4: ['WEREWOLF', 'SEER', 'BODYGUARD', 'VILLAGER'],
  5: ['WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'VILLAGER'],
  6: ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'VILLAGER'],
  7: ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'VILLAGER'],
  8: ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER'],
  9: ['WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER'],
  10: ['WEREWOLF', 'WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER'],
  11: ['WEREWOLF', 'WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER', 'VILLAGER'],
  12: ['WEREWOLF', 'WEREWOLF', 'WEREWOLF', 'SEER', 'BODYGUARD', 'WITCH', 'HUNTER', 'CUPID', 'VILLAGER', 'VILLAGER', 'VILLAGER', 'VILLAGER'],
};

/**
 * Default Chibi avatar image URLs for Mobile Card UI
 */
export const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiWolf',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiSeer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiKnight',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiWitch',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiArcher',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiCupid',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiFarmer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiGuard',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiGhost',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiHero',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiShadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiStar',
];

/**
 * Vietnamese default bot names for testing
 */
export const BOT_NAMES = [
  '🤖 Bot Tèo',
  '🤖 Bot Mít',
  '🤖 Bot Hổ',
  '🤖 Bot Cáo',
  '🤖 Bot Gấu',
  '🤖 Bot Thỏ',
  '🤖 Bot Sóc',
  '🤖 Bot Sư Tử',
  '🤖 Bot Đại Bàng',
  '🤖 Bot Rùa',
];

/**
 * Win condition messages in Vietnamese
 */
export const VICTORY_MESSAGES = {
  WEREWOLF: 'Phe Ma Sói đã chiến thắng! Bầy sói đã thâu tóm hoàn toàn ngôi làng trong bóng tối.',
  VILLAGE: 'Phe Dân Làng đã chiến thắng! Toàn bộ Ma Sói đã bị tiêu diệt, mang lại bình yên cho làng.',
  LOVERS: 'Cặp Đôi Tình Nhân đã chiến thắng! Tình yêu đích thực đã vượt qua mọi hiểm nguy và sống sót cuối cùng.',
} as const;

