/**
 * Role definitions, alignments, night priority orders, and Vietnamese descriptions.
 */

import { RoleType, Team } from './types';

export interface RoleDefinition {
  id: RoleType;
  nameVi: string;
  nameEn: string;
  team: Team;
  nightOrder: number; // 1 to 5 for active night roles, 0 for inactive
  hasNightAction: boolean;
  isFirstNightOnly?: boolean;
  descriptionVi: string;
  actionVi: string;
  wakePromptVi: string;
  icon: string;
  cardColor: string;
  borderGlowColor: string;
}

/**
 * Strict night sequence order as requested:
 * Cupid -> Bodyguard -> Werewolves -> Witch -> Seer
 */
export const NIGHT_ROLE_ORDER: RoleType[] = [
  'CUPID',
  'BODYGUARD',
  'WEREWOLF',
  'WITCH',
  'SEER',
];

export const ROLE_DEFINITIONS: Record<RoleType, RoleDefinition> = {
  CUPID: {
    id: 'CUPID',
    nameVi: 'Thần Tình Yêu (Cupid)',
    nameEn: 'Cupid',
    team: 'SOLO',
    nightOrder: 1,
    hasNightAction: true,
    isFirstNightOnly: true,
    descriptionVi:
      'Vào đêm đầu tiên, Cupid bắn 2 mũi tên thần ái để kết nối 2 người chơi thành cặp đôi tình nhân. Nếu 1 trong 2 người chết, người kia sẽ chết theo vì đau lòng.',
    actionVi: 'Chọn 2 người chơi để kết duyên làm đôi tình nhân suốt ván đấu.',
    wakePromptVi:
      'Thần Tình Yêu hãy thức dậy và chọn 2 người chơi để kết duyên thành cặp tình nhân.',
    icon: '💘',
    cardColor: 'from-pink-600 to-rose-700',
    borderGlowColor: '#ec4899',
  },
  BODYGUARD: {
    id: 'BODYGUARD',
    nameVi: 'Bảo Vệ',
    nameEn: 'Bodyguard',
    team: 'VILLAGE',
    nightOrder: 2,
    hasNightAction: true,
    descriptionVi:
      'Mỗi đêm, Bảo Vệ chọn 1 người chơi để bảo vệ khỏi nanh vuốt của Ma Sói. Không thể bảo vệ cùng 1 người trong 2 đêm liên tiếp (nhưng có thể bảo vệ chính mình).',
    actionVi: 'Chọn 1 người chơi để bảo vệ đêm nay (không chọn người đêm trước).',
    wakePromptVi: 'Bảo Vệ hãy thức dậy, đêm nay bạn muốn bảo vệ ai khỏi nanh vuốt sói?',
    icon: '🛡️',
    cardColor: 'from-blue-600 to-cyan-700',
    borderGlowColor: '#0ea5e9',
  },
  WEREWOLF: {
    id: 'WEREWOLF',
    nameVi: 'Ma Sói',
    nameEn: 'Werewolf',
    team: 'WEREWOLF',
    nightOrder: 3,
    hasNightAction: true,
    descriptionVi:
      'Mỗi đêm, bầy Sói cùng thức giấc, trao đổi trong bóng tối và thống nhất cắn xé 1 người dân. Ban ngày giả dạng dân lành để không bị phát hiện.',
    actionVi: 'Thống nhất cùng bầy sói chọn 1 nạn nhân xấu số để cắn xé.',
    wakePromptVi: 'Ma Sói hãy thức giấc, bàn bạc và thống nhất chọn 1 nạn nhân đêm nay.',
    icon: '🐺',
    cardColor: 'from-red-800 to-red-950',
    borderGlowColor: '#ef4444',
  },
  WITCH: {
    id: 'WITCH',
    nameVi: 'Phù Thủy',
    nameEn: 'Witch',
    team: 'VILLAGE',
    nightOrder: 4,
    hasNightAction: true,
    descriptionVi:
      'Phù Thủy sở hữu 2 bình thuốc thần kỳ trong cả trận: Bình Cứu (cứu sống nạn nhân bị Sói cắn) và Bình Độc (đầu độc 1 người bất kỳ). Mỗi bình chỉ dùng 1 lần.',
    actionVi: 'Biết ai bị sói cắn: Quyết định dùng bình cứu hoặc dùng bình độc.',
    wakePromptVi:
      'Phù Thủy thức giấc! Bạn nhìn thấy nạn nhân của Sói. Bạn muốn cứu hoặc đầu độc ai không?',
    icon: '🧙‍♀️',
    cardColor: 'from-purple-700 to-indigo-900',
    borderGlowColor: '#a855f7',
  },
  SEER: {
    id: 'SEER',
    nameVi: 'Tiên Tri',
    nameEn: 'Seer',
    team: 'VILLAGE',
    nightOrder: 5,
    hasNightAction: true,
    descriptionVi:
      'Mỗi đêm, Tiên Tri có thể soi và nhìn thấu thân phận thật sự của 1 người chơi để biết họ theo phe Dân Làng hay phe Ma Sói.',
    actionVi: 'Chọn 1 người chơi còn sống để nhìn thấu thân phận thật.',
    wakePromptVi: 'Tiên Tri hãy thức giấc, đêm nay bạn muốn soi thân phận của ai?',
    icon: '🔮',
    cardColor: 'from-emerald-600 to-teal-800',
    borderGlowColor: '#10b981',
  },
  HUNTER: {
    id: 'HUNTER',
    nameVi: 'Thợ Săn',
    nameEn: 'Hunter',
    team: 'VILLAGE',
    nightOrder: 0,
    hasNightAction: false,
    descriptionVi:
      'Khi Thợ Săn chết (bị sói cắn hoặc bị treo cổ), Thợ Săn có quyền nổ 1 phát súng cuối cùng để kéo theo 1 người chơi khác cùng chết.',
    actionVi: 'Bắn chết 1 kẻ bất kỳ khi bạn bị sát hại hoặc bị xử tử.',
    wakePromptVi: 'Thợ Săn đã ngã xuống, hãy chọn 1 người chết cùng bạn!',
    icon: '🏹',
    cardColor: 'from-amber-600 to-yellow-800',
    borderGlowColor: '#f59e0b',
  },
  VILLAGER: {
    id: 'VILLAGER',
    nameVi: 'Dân Làng',
    nameEn: 'Villager',
    team: 'VILLAGE',
    nightOrder: 0,
    hasNightAction: false,
    descriptionVi:
      'Không có quyền năng trong bóng đêm. Ban ngày thảo luận tìm manh mối và bỏ phiếu treo cổ kẻ mà mình nghi ngờ là Ma Sói.',
    actionVi: 'Ngủ say trong đêm. Ban ngày tích cực biện hộ và bỏ phiếu công lý.',
    wakePromptVi: 'Dân Làng đang ngủ say...',
    icon: '🧑‍🌾',
    cardColor: 'from-stone-600 to-stone-800',
    borderGlowColor: '#94a3b8',
  },
};

/**
 * Returns role definition details
 */
export function getRoleDefinition(role: RoleType): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}

/**
 * Checks if role belongs to the evil werewolf faction
 */
export function isEvilRole(role: RoleType): boolean {
  return ROLE_DEFINITIONS[role].team === 'WEREWOLF';
}

/**
 * Returns default team for a given role
 */
export function getRoleTeam(role: RoleType): Team {
  return ROLE_DEFINITIONS[role].team;
}

/**
 * Returns the night action order index (1..5) or 0 if no night action
 */
export function getNightOrder(role: RoleType): number {
  return ROLE_DEFINITIONS[role].nightOrder;
}

