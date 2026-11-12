import { io, Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  SocketJoinRoomPayload,
  SocketChatPayload,
  SocketNightActionPayload,
  SocketVotePayload,
  SocketHunterShotPayload,
} from '@werewolf/shared';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      // In production, connects to the same origin (window.location.origin)
      // In dev with Vite, Vite proxies /socket.io to localhost:3000
      this.socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinRoom(payload: SocketJoinRoomPayload) {
    this.socket?.emit(SOCKET_EVENTS.JOIN_ROOM, payload);
  }

  public leaveRoom() {
    this.socket?.emit(SOCKET_EVENTS.LEAVE_ROOM);
  }

  public startGame() {
    this.socket?.emit(SOCKET_EVENTS.START_GAME);
  }

  public sendChat(payload: SocketChatPayload) {
    this.socket?.emit(SOCKET_EVENTS.SEND_CHAT, payload);
  }

  public sendNightAction(payload: SocketNightActionPayload) {
    this.socket?.emit(SOCKET_EVENTS.NIGHT_ACTION, payload);
  }

  public castVote(payload: SocketVotePayload) {
    this.socket?.emit(SOCKET_EVENTS.CAST_VOTE, payload);
  }

  public shootHunter(payload: SocketHunterShotPayload) {
    this.socket?.emit(SOCKET_EVENTS.HUNTER_SHOT, payload);
  }

  public restartGame() {
    this.socket?.emit(SOCKET_EVENTS.RESTART_GAME);
  }

  public addBot(name?: string) {
    this.socket?.emit(SOCKET_EVENTS.ADD_BOT, { name });
  }

  public removeBot(botId: string) {
    this.socket?.emit(SOCKET_EVENTS.REMOVE_BOT, { botId });
  }
}

export const socketService = new SocketService();
