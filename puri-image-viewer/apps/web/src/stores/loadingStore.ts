import { StateCreator, createStore } from 'zustand/vanilla';

interface LoadingStore {
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}

const loadingStoreCreator: StateCreator<LoadingStore> = (set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
});

export const loadingStore = createStore(loadingStoreCreator);
