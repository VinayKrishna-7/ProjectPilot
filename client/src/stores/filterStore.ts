import { create } from 'zustand';

export interface IssueFilters {
  status?: string;
  priority?: string;
  type?: string;
  assignee?: string;
  reporter?: string;
  sprint?: string;
  label?: string;
  search?: string;
}

interface FilterState {
  filters: IssueFilters;
  setFilter: (key: keyof IssueFilters, value: string | undefined) => void;
  setFilters: (filters: IssueFilters) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useFilterStore = create<FilterState>()((set, get) => ({
  filters: {},
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value || undefined },
    })),
  setFilters: (filters) => set({ filters }),
  clearFilters: () => set({ filters: {} }),
  hasActiveFilters: () => Object.values(get().filters).some(Boolean),
}));
