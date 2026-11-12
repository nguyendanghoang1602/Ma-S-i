import { GameEngine } from '../game/GameEngine';
import { GameSettings } from '@werewolf/shared';

export interface CreateRoomParams {
  hostPlayer: { id: string; name: string; avatar: string };
  customCode?: string;
  settings?: Partial<GameSettings>;
}

export class RoomManager {
  private rooms: Map<string, GameEngine> = new Map();
  private playerToRoom: Map<string, string> = new Map(); // playerId -> roomCode

  /**
   * Generates a random 6-character alphanumeric room code
   */
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Creates a new game room
   */
  public createRoom(params: CreateRoomParams): GameEngine {
    let code = params.customCode
      ? params.customCode.trim().toUpperCase()
      : this.generateRoomCode();

    if (!code) {
      code = this.generateRoomCode();
    }

    if (this.rooms.has(code)) {
      throw new Error(`Mã phòng ${code} đã tồn tại, vui lòng chọn mã khác`);
    }

    const game = new GameEngine({
      code,
      hostPlayer: params.hostPlayer,
      settings: params.settings,
    });

    this.rooms.set(code, game);
    this.playerToRoom.set(params.hostPlayer.id, code);

    return game;
  }

  /**
   * Retrieves a room by its code
   */
  public getRoom(code: string): GameEngine | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  /**
   * Joins an existing room
   */
  public joinRoom(
    code: string,
    player: { id: string; name: string; avatar: string }
  ): GameEngine {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error(`Không tìm thấy phòng chơi với mã ${code}`);
    }

    room.addPlayer(player);
    this.playerToRoom.set(player.id, room.state.code);
    return room;
  }

  /**
   * Removes a player from their room and cleans up empty rooms
   */
  public leaveRoom(
    code: string,
    playerId: string
  ): { room: GameEngine | undefined; isEmpty: boolean } {
    const room = this.getRoom(code);
    if (!room) {
      return { room: undefined, isEmpty: true };
    }

    room.removePlayer(playerId);
    this.playerToRoom.delete(playerId);

    const connectedCount = room.state.players.filter((p) => p.connected).length;
    if (connectedCount === 0 && room.state.players.length === 0) {
      room.clearTimer();
      this.rooms.delete(room.state.code);
      return { room: undefined, isEmpty: true };
    }

    return { room, isEmpty: false };
  }

  /**
   * Finds the room code that a player belongs to
   */
  public getRoomCodeByPlayerId(playerId: string): string | undefined {
    return this.playerToRoom.get(playerId);
  }

  /**
   * Finds the room instance that a player belongs to
   */
  public getRoomByPlayerId(playerId: string): GameEngine | undefined {
    const code = this.getRoomCodeByPlayerId(playerId);
    return code ? this.getRoom(code) : undefined;
  }

  /**
   * Returns all active rooms count
   */
  public getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Destroys a room explicitly
   */
  public deleteRoom(code: string): boolean {
    const room = this.getRoom(code);
    if (room) {
      room.clearTimer();
      return this.rooms.delete(code.toUpperCase());
    }
    return false;
  }
}
