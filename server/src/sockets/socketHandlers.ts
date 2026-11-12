import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/RoomManager';
import { GameEngine } from '../game/GameEngine';
import {
  SOCKET_EVENTS,
  SocketJoinRoomPayload,
  SocketChatPayload,
  SocketNightActionPayload,
  SocketVotePayload,
  SocketHunterShotPayload,
} from '@werewolf/shared';

interface SocketData {
  playerId?: string;
  playerName?: string;
  roomCode?: string;
}

/**
 * Broadcasts role-masked room state to each individual player in the room
 */
export function broadcastRoomState(io: Server, room: GameEngine): void {
  const roomSockets = io.sockets.adapter.rooms.get(room.state.code);
  if (!roomSockets) return;

  for (const socketId of roomSockets) {
    const socket = io.sockets.sockets.get(socketId) as Socket<any, any, any, SocketData> | undefined;
    if (socket && socket.data.playerId) {
      socket.emit(SOCKET_EVENTS.ROOM_STATE, room.getClientState(socket.data.playerId));
    }
  }
}

export function registerSocketHandlers(io: Server, roomManager: RoomManager): void {
  io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    // ----------------------------------------------------
    // JOIN / CREATE ROOM
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (payload: SocketJoinRoomPayload) => {
      try {
        const { roomCode, playerName, avatar } = payload;
        const playerId = socket.id;

        let room: GameEngine;
        const normalizedCode = roomCode ? roomCode.trim().toUpperCase() : '';

        // If room exists, join it; otherwise create with this code or new code
        if (normalizedCode && roomManager.getRoom(normalizedCode)) {
          room = roomManager.joinRoom(normalizedCode, {
            id: playerId,
            name: playerName || 'Người chơi',
            avatar: avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiWolf',
          });
        } else {
          room = roomManager.createRoom({
            customCode: normalizedCode || undefined,
            hostPlayer: {
              id: playerId,
              name: playerName || 'Chủ phòng',
              avatar: avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=ChibiWolf',
            },
          });
        }

        socket.data.playerId = playerId;
        socket.data.playerName = playerName;
        socket.data.roomCode = room.state.code;

        socket.join(room.state.code);

        // Attach state change broadcaster to engine
        room.onStateUpdate = () => {
          broadcastRoomState(io, room);
        };

        // Send state to joined player and broadcast to others
        socket.emit(SOCKET_EVENTS.ROOM_STATE, room.getClientState(playerId));
        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Lỗi khi vào phòng' });
      }
    });

    // ----------------------------------------------------
    // START GAME
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        if (room.state.hostId !== playerId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Chỉ chủ phòng mới có quyền bắt đầu ván đấu' });
          return;
        }

        room.startGame();
        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Không thể bắt đầu ván đấu' });
      }
    });

    // ----------------------------------------------------
    // NIGHT ACTION
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.NIGHT_ACTION, (payload: SocketNightActionPayload) => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const result = room.handleNightAction({
          actorId: playerId,
          actionType: payload.actionType,
          targetId: payload.targetId,
          secondTargetId: payload.secondTargetId,
        });

        if (!result.success) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: result.message || 'Hành động không hợp lệ' });
          return;
        }

        // If Seer checked someone, send result back to Seer privately
        if (result.seerResult) {
          socket.emit(SOCKET_EVENTS.SEER_RESULT, result.seerResult);
        }

        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Lỗi xử lý hành động ban đêm' });
      }
    });

    // ----------------------------------------------------
    // DAY VOTING
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.CAST_VOTE, (payload: SocketVotePayload) => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const result = room.castVote(playerId, payload.targetId);
        if (!result.success) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: result.message || 'Lỗi khi bỏ phiếu' });
          return;
        }

        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Lỗi bỏ phiếu' });
      }
    });

    // ----------------------------------------------------
    // HUNTER SHOT
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.HUNTER_SHOT, (payload: SocketHunterShotPayload) => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const result = room.handleHunterShoot(playerId, payload.targetId);
        if (!result.success) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: result.message || 'Phát súng không hợp lệ' });
          return;
        }

        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Lỗi phát súng thợ săn' });
      }
    });

    // ----------------------------------------------------
    // RESTART GAME
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.RESTART_GAME, () => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        if (room.state.hostId !== playerId) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: 'Chỉ chủ phòng mới có thể chơi lại' });
          return;
        }

        room.restartGame();
        broadcastRoomState(io, room);
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Không thể cài lại ván đấu' });
      }
    });

    // ----------------------------------------------------
    // CHAT MESSAGE
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.SEND_CHAT, (payload: SocketChatPayload) => {
      try {
        const { roomCode, playerId } = socket.data;
        if (!roomCode || !playerId) return;

        const room = roomManager.getRoom(roomCode);
        if (!room) return;

        const message = room.addChatMessage(playerId, payload.channel, payload.content);
        if (!message) return;

        if (payload.channel === 'WEREWOLF') {
          // Broadcast only to alive werewolf sockets
          const roomSockets = io.sockets.adapter.rooms.get(room.state.code);
          if (roomSockets) {
            for (const sockId of roomSockets) {
              const targetSock = io.sockets.sockets.get(sockId) as Socket<any, any, any, SocketData> | undefined;
              if (targetSock && targetSock.data.playerId) {
                const p = room.getPlayer(targetSock.data.playerId);
                if (p && p.role === 'WEREWOLF') {
                  targetSock.emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
                }
              }
            }
          }
        } else {
          // Broadcast to everyone in room
          io.to(room.state.code).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
        }
      } catch (err: any) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: err.message || 'Lỗi khi gửi tin nhắn' });
      }
    });

    // ----------------------------------------------------
    // LEAVE ROOM & DISCONNECT
    // ----------------------------------------------------
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
      handlePlayerExit(socket, io, roomManager);
    });

    socket.on('disconnect', () => {
      handlePlayerExit(socket, io, roomManager);
    });
  });
}

function handlePlayerExit(
  socket: Socket<any, any, any, SocketData>,
  io: Server,
  roomManager: RoomManager
): void {
  const { roomCode, playerId } = socket.data;
  if (!roomCode || !playerId) return;

  socket.leave(roomCode);
  const { room, isEmpty } = roomManager.leaveRoom(roomCode, playerId);

  if (!isEmpty && room) {
    broadcastRoomState(io, room);
  }
}
