import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { playersService } from '@/api/services/players.service';
import type { PlayerProfile, StoredPlayerSession } from '@/types';

const STORAGE_KEY = 'ecostep_player_session';

export interface PlayerContextType {
  player: PlayerProfile | null;
  sessionToken: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isModalOpen: boolean;
  error: string | null;
  createPlayer: (username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
  openPlayerModal: () => void;
  closePlayerModal: () => void;
  clearError: () => void;
}

/**
 * Safely reads and validates stored player session from localStorage.
 */
function getStoredSession(): StoredPlayerSession | null {
  try {
    const storedJson = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (!storedJson) return null;
    const parsed = JSON.parse(storedJson);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.playerId === 'string' &&
      typeof parsed.username === 'string' &&
      typeof parsed.sessionToken === 'string' &&
      parsed.sessionToken.trim().length > 0
    ) {
      return parsed;
    }
  } catch {
    // Malformed JSON
  }
  return null;
}

const defaultPlayerContext: PlayerContextType = {
  player: null,
  sessionToken: null,
  isLoading: false,
  isSubmitting: false,
  isModalOpen: false,
  error: null,
  createPlayer: async () => false,
  logout: async () => {},
  refreshPlayer: async () => {},
  openPlayerModal: () => {},
  closePlayerModal: () => {},
  clearError: () => {},
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  // Synchronous hydration from localStorage on initial render to prevent flash of unauthenticated state
  const [player, setPlayer] = useState<PlayerProfile | null>(() => {
    const stored = getStoredSession();
    if (stored) {
      return {
        playerId: stored.playerId,
        username: stored.username,
        createdAt: '',
        lastActiveAt: '',
      };
    }
    return null;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    const stored = getStoredSession();
    return stored?.sessionToken || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const stored = getStoredSession();
    return Boolean(stored);
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Validate guest session with backend on load
  useEffect(() => {
    let isMounted = true;

    const validateSession = async () => {
      const stored = getStoredSession();
      if (!stored) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const verifiedProfile = await playersService.getCurrentPlayer(
          stored.sessionToken,
        );

        if (isMounted) {
          setPlayer(verifiedProfile);
          setSessionToken(stored.sessionToken);
          setError(null);
        }
      } catch (err: any) {
        const status = err?.response?.status;

        // ONLY clear session on confirmed auth revocation (401, 403, 404)
        if (status === 401 || status === 403 || status === 404) {
          try {
            localStorage.removeItem(STORAGE_KEY);
          } catch {
            // Ignore storage errors
          }
          if (isMounted) {
            setPlayer(null);
            setSessionToken(null);
            setError('Your previous guest session has expired. Please choose a username to join again.');
          }
        } else {
          // Network error or temporary server unavailability:
          // Keep the locally stored player profile active rather than wiping user's session!
          console.warn('[EcoStep] Network error while verifying guest player session. Retaining offline session.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openPlayerModal = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closePlayerModal = useCallback(() => {
    setError(null);
    setIsModalOpen(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createPlayer = useCallback(
    async (username: string): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await playersService.createGuestPlayer(username.trim());
        const { player: createdProfile, sessionToken: token } = response;

        // Persist session token to browser storage
        const sessionData: StoredPlayerSession = {
          playerId: createdProfile.playerId,
          username: createdProfile.username,
          sessionToken: token,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
        } catch {
          // Ignore storage quota errors
        }

        setPlayer(createdProfile);
        setSessionToken(token);
        setIsModalOpen(false);
        return true;
      } catch (err: any) {
        if (err?.response?.status === 409) {
          setError('That username is already taken. Please choose another one.');
        } else if (err?.response?.data?.message) {
          const msg = err.response.data.message;
          setError(Array.isArray(msg) ? msg[0] : msg);
        } else if (err?.message === 'Network Error' || !err?.response) {
          setError('Unable to reach the server. Please check your connection and try again.');
        } else {
          setError('Failed to create guest player profile. Please try again.');
        }
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const currentToken = sessionToken || getStoredSession()?.sessionToken;
    try {
      if (currentToken) {
        await playersService.logout(currentToken);
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }
      setPlayer(null);
      setSessionToken(null);
    }
  }, [sessionToken]);

  const refreshPlayer = useCallback(async () => {
    const currentToken = sessionToken || getStoredSession()?.sessionToken;
    if (!currentToken) return;
    try {
      const updated = await playersService.getCurrentPlayer(currentToken);
      setPlayer(updated);
    } catch (err) {
      console.warn('[EcoStep] Failed to refresh player profile:', err);
    }
  }, [sessionToken]);

  return (
    <PlayerContext.Provider
      value={{
        player,
        sessionToken,
        isLoading,
        isSubmitting,
        isModalOpen,
        error,
        createPlayer,
        logout,
        refreshPlayer,
        openPlayerModal,
        closePlayerModal,
        clearError,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const context = useContext(PlayerContext);
  if (!context) {
    return defaultPlayerContext;
  }
  return context;
}
