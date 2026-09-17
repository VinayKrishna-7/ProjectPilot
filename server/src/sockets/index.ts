import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

export function initializeSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join:workspace', (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on('join:project', (projectId: string) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('join:issue', (issueId: string) => {
      socket.join(`issue:${issueId}`);
    });

    socket.on('leave:project', (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('leave:issue', (issueId: string) => {
      socket.leave(`issue:${issueId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToProject(projectId: string, event: string, data: unknown): void {
  if (io) io.to(`project:${projectId}`).emit(event, data);
}

export function emitToWorkspace(workspaceId: string, event: string, data: unknown): void {
  if (io) io.to(`workspace:${workspaceId}`).emit(event, data);
}

export function emitToIssue(issueId: string, event: string, data: unknown): void {
  if (io) io.to(`issue:${issueId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io) io.to(`user:${userId}`).emit(event, data);
}
