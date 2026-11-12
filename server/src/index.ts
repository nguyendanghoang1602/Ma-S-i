import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { RoomManager } from './rooms/RoomManager';
import { registerSocketHandlers } from './sockets/socketHandlers';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS enabled
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const roomManager = new RoomManager();
registerSocketHandlers(io, roomManager);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    rooms: roomManager.getRoomCount(),
    timestamp: new Date().toISOString(),
  });
});

// API Room info
app.get('/api/rooms/:code', (req, res) => {
  const room = roomManager.getRoom(req.params.code);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }
  res.json({
    code: room.state.code,
    phase: room.state.phase,
    playersCount: room.state.players.length,
  });
});

// Production Static Serving: Single-port deployment for Back4App, Render, Railway, etc.
const isProduction = process.env.NODE_ENV === 'production';
const candidateClientDistPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist'),
];

let clientDistPath: string | null = null;
for (const p of candidateClientDistPaths) {
  if (fs.existsSync(p)) {
    clientDistPath = p;
    break;
  }
}

if (isProduction || clientDistPath) {
  const staticDir = clientDistPath || path.resolve(__dirname, '../../client/dist');
  app.use(express.static(staticDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    const indexPath = path.join(staticDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
}

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🐺 Werewolf Game Server listening on http://localhost:${PORT}`);
  });
}

export { app, server, io, roomManager };
