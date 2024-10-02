import { StateCreator, createStore } from 'zustand/vanilla';
import { IDToken } from '@web/lib/auth/types';
import { API_BASE_URL } from '@web/constants';
import { persist } from 'zustand/middleware';
import { loadingStore } from './loadingStore';

interface AuthStore {
  readonly idToken?: IDToken;
  readonly isLoggingIn: boolean;

  login: (username: string, password: string) => Promise<IDToken | undefined>;
}

const authStoreCreator: StateCreator<AuthStore> = (set) => ({
  isLoggingIn: false,

  login: async (username, password) => {
    loadingStore.getState().setLoading(true);
    set({ isLoggingIn: true });

    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate');
      }

      const result = await response.json();
      const idToken = IDToken.from(result.idToken);

      set({ idToken, isLoggingIn: false });

      return idToken;
    } catch (error) {
      console.error('Login error:', error);

      set({ idToken: undefined, isLoggingIn: false });
      return undefined;
    } finally {
      loadingStore.getState().setLoading(false);
    }
  },
});

const authStore = createStore(persist(authStoreCreator, { name: 'auth' }));
export default authStore;
