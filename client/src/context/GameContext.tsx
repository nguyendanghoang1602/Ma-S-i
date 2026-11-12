import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react';
import {
  RoomState,
  Player,
  PhaseType,
  SeerInspectionResult,
  SOCKET_EVENTS,
  ChatMessage,
  NightActionType,
} from '@werewolf/shared';
import { socketService } from '../services/socket';
import { sounds } from '../utils/audio';

interface GameContextType {
  roomState: RoomState | null;
  me: Player | null;
  socketId: string | null;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;

  // UI state
  activeTab: 'cards' | 'chat' | 'logs';
  setActiveTab: (tab: 'cards' | 'chat' | 'logs') => void;
  unreadChat: number;
  clearUnreadChat: () => void;

  isRoleDrawerOpen: boolean;
  setIsRoleDrawerOpen: (open: boolean) => void;

  seerResult: SeerInspectionResult | null;
  setSeerResult: (result: SeerInspectionResult | null) => void;

  isMuted: boolean;
  toggleMute: () => void;

  // Actions
  joinRoom: (roomCode: string, playerName: string, avatar: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  sendChatMessage: (channel: 'ALL' | 'WEREWOLF', content: string) => void;
  performNightAction: (actionType: NightActionType, targetId?: string | null, secondTargetId?: string | null) => void;
  castVote: (targetId: string | null) => void;
  hunterShoot: (targetId: string) => void;
  restartGame: () => void;
  addBot: (name?: string) => void;
  removeBot: (botId: string) => void;
  fillBots: (targetCount?: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'cards' | 'chat' | 'logs'>('cards');
  const [unreadChat, setUnreadChat] = useState<number>(0);
  const [isRoleDrawerOpen, setIsRoleDrawerOpen] = useState<boolean>(false);
  const [seerResult, setSeerResult] = useState<SeerInspectionResult | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(sounds.isMuted());

  // Ref tracking previous phase and deaths for sound cues
  const prevPhaseRef = useRef<PhaseType | null>(null);
  const prevDeathsCountRef = useRef<number>(0);

  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id || null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleRoomState = (state: RoomState) => {
      setRoomState(state);

      // Sound triggers on phase changes
      if (prevPhaseRef.current !== state.phase) {
        if (state.phase === 'NIGHT') {
          sounds.playNightShift();
        } else if (state.phase === 'DAY_DISCUSSION' || state.phase === 'DAY_VOTING') {
          sounds.playDayShift();
        } else if (state.phase === 'GAME_OVER') {
          sounds.playVictoryFanfare();
        }
        prevPhaseRef.current = state.phase;
      }

      // Sound triggers on death announcements
      if (state.lastNightDeaths && state.lastNightDeaths.length > prevDeathsCountRef.current) {
        sounds.playDeathSound();
      }
      prevDeathsCountRef.current = state.lastNightDeaths?.length || 0;
    };

    const handleChatMessage = (msg: ChatMessage) => {
      // If user is currently looking at cards or logs, increment unread counter
      setActiveTab((currentTab) => {
        if (currentTab !== 'chat') {
          setUnreadChat((prev) => prev + 1);
        }
        return currentTab;
      });
    };

    const handleSeerResult = (res: SeerInspectionResult) => {
      setSeerResult(res);
    };

    const handleError = (errMsg: string | { message: string }) => {
      const msg = typeof errMsg === 'string' ? errMsg : errMsg?.message || 'Có lỗi xảy ra!';
      setError(msg);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
    socket.on(SOCKET_EVENTS.SEER_RESULT, handleSeerResult);
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChatMessage);
      socket.off(SOCKET_EVENTS.SEER_RESULT, handleSeerResult);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, []);

  // Timer tick audio effect when remaining <= 5s
  useEffect(() => {
    if (!roomState) return;
    if (roomState.timer > 0 && roomState.timer <= 5 && roomState.phase !== 'LOBBY' && roomState.phase !== 'GAME_OVER') {
      sounds.playTimerTick();
    }
  }, [roomState?.timer, roomState?.phase]);

  // Derived current player ('me')
  const me = useMemo(() => {
    if (!roomState || !socketId) return null;
    return roomState.players.find((p) => p.id === socketId) || null;
  }, [roomState, socketId]);

  const toggleMute = () => {
    const updated = sounds.toggleMute();
    setIsMuted(updated);
  };

  const clearError = () => setError(null);

  const clearUnreadChat = () => setUnreadChat(0);

  const joinRoom = (roomCode: string, playerName: string, avatar: string) => {
    setError(null);
    socketService.joinRoom({ roomCode, playerName, avatar });
  };

  const leaveRoom = () => {
    socketService.leaveRoom();
    setRoomState(null);
  };

  const startGame = () => {
    socketService.startGame();
  };

  const sendChatMessage = (channel: 'ALL' | 'WEREWOLF', content: string) => {
    socketService.sendChat({ channel, content });
  };

  const performNightAction = (
    actionType: NightActionType,
    targetId?: string | null,
    secondTargetId?: string | null
  ) => {
    socketService.sendNightAction({ actionType, targetId, secondTargetId });
  };

  const castVote = (targetId: string | null) => {
    sounds.playVoteSound();
    socketService.castVote({ targetId });
  };

  const hunterShoot = (targetId: string) => {
    sounds.playDeathSound();
    socketService.shootHunter({ targetId });
  };

  const restartGame = () => {
    socketService.restartGame();
  };

  const addBot = (name?: string) => {
    socketService.addBot(name);
  };

  const removeBot = (botId: string) => {
    socketService.removeBot(botId);
  };

  const fillBots = (targetCount: number = 6) => {
    if (!roomState) return;
    const currentCount = roomState.players.length;
    const needed = Math.max(0, targetCount - currentCount);
    for (let i = 0; i < needed; i++) {
      setTimeout(() => {
        socketService.addBot();
      }, i * 150);
    }
  };

  return (
    <GameContext.Provider
      value={{
        roomState,
        me,
        socketId,
        isConnected,
        error,
        clearError,
        activeTab,
        setActiveTab,
        unreadChat,
        clearUnreadChat,
        isRoleDrawerOpen,
        setIsRoleDrawerOpen,
        seerResult,
        setSeerResult,
        isMuted,
        toggleMute,
        joinRoom,
        leaveRoom,
        startGame,
        sendChatMessage,
        performNightAction,
        castVote,
        hunterShoot,
        restartGame,
        addBot,
        removeBot,
        fillBots,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
