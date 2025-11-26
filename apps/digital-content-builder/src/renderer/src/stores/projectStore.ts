import { create } from 'zustand';

export interface ProjectCard {
  id: string;
  name: string;
  type: string;
  updatedAt: number;
  isFavorite?: number;
}

interface ProjectState {
  items: ProjectCard[];
  search: string;
  setSearch: (q: string) => void;
  refresh: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  items: [],
  search: '',
  setSearch: (q) => set({ search: q }),
  refresh: async () => {
    try {
      // @ts-ignore
      const rows = await window.electronAPI.listProjects();
      set({ items: rows ?? [] });
    } catch {
      // ignore
    }
  }
}));
