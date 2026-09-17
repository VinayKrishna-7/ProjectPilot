import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeWorkspaceId: string | null;
  activeProjectId: string | null;
  setActiveWorkspace: (id: string | null) => void;
  setActiveProject: (id: string | null) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
      activeWorkspaceId: null,
      activeProjectId: null,
      setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),
      setActiveProject: (id) => set({ activeProjectId: id }),
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: 'projectpilot-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    }
  )
);
