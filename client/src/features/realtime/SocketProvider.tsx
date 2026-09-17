import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  joinIssue: (issueId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinProject: () => {},
  leaveProject: () => {},
  joinIssue: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = io('/', {
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });

    socketRef.current = socket;

    socket.on('issue_created', () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });
    socket.on('issue_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });
    socket.on('issue_deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['board'] });
    });
    socket.on('comment_created', () => queryClient.invalidateQueries({ queryKey: ['comments'] }));
    socket.on('comment_updated', () => queryClient.invalidateQueries({ queryKey: ['comments'] }));
    socket.on('comment_deleted', () => queryClient.invalidateQueries({ queryKey: ['comments'] }));
    socket.on('notification_created', () => queryClient.invalidateQueries({ queryKey: ['notifications'] }));
    socket.on('sprint_started', () => queryClient.invalidateQueries({ queryKey: ['sprints'] }));
    socket.on('sprint_completed', () => queryClient.invalidateQueries({ queryKey: ['sprints'] }));

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);

  const joinProject = (projectId: string) => socketRef.current?.emit('join:project', projectId);
  const leaveProject = (projectId: string) => socketRef.current?.emit('leave:project', projectId);
  const joinIssue = (issueId: string) => socketRef.current?.emit('join:issue', issueId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinProject, leaveProject, joinIssue }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
