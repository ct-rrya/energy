import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export const VISITOR_ID_STORAGE_KEY = 'ecostep_admin_chat_visitor_id';
export const VISITOR_NAME_STORAGE_KEY = 'ecostep_admin_chat_visitor_name';
export const VISITOR_NICKNAME_STORAGE_KEY = 'ecostep_visitor_nickname';
export const VISITOR_WELCOME_SEEN_KEY = 'ecostep_visitor_welcome_seen';

const NICKNAME_ADJECTIVES = [
  'Eco',
  'Solar',
  'Green',
  'Volt',
  'Kinetic',
  'Bright',
  'Swift',
  'Fresh',
  'Leafy',
  'Spark',
  'Terra',
  'Pulse',
];

const NICKNAME_NOUNS = [
  'Walker',
  'Stride',
  'Stepper',
  'Runner',
  'Voyager',
  'Pacer',
  'Trail',
  'Scout',
  'Mover',
  'Glider',
  'Ranger',
  'Spark',
];

export function generateRandomNickname(): string {
  const adj =
    NICKNAME_ADJECTIVES[Math.floor(Math.random() * NICKNAME_ADJECTIVES.length)];
  const noun =
    NICKNAME_NOUNS[Math.floor(Math.random() * NICKNAME_NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj}${noun}-${num}`;
}

export function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'visitor-ssr';
  try {
    const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (existing && existing.length >= 6) return existing;
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `vis-${crypto.randomUUID()}`
        : `vis-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return `vis-${Date.now()}`;
  }
}

export function getStoredVisitorNickname(): string {
  if (typeof window === 'undefined') return '';
  try {
    const nick =
      localStorage.getItem(VISITOR_NICKNAME_STORAGE_KEY) ||
      localStorage.getItem(VISITOR_NAME_STORAGE_KEY) ||
      '';
    return nick.trim();
  } catch {
    return '';
  }
}

function loadWelcomeSeen(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(VISITOR_WELCOME_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistNickname(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITOR_NICKNAME_STORAGE_KEY, name);
    localStorage.setItem(VISITOR_NAME_STORAGE_KEY, name);
  } catch {
    /* ignore storage quota errors */
  }
}

function persistWelcomeSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VISITOR_WELCOME_SEEN_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export interface VisitorContextValue {
  visitorId: string;
  nickname: string;
  suggestedNickname: string;
  hasCompletedWelcome: boolean;
  isNicknameModalOpen: boolean;
  setNickname: (nextName: string) => void;
  completeWelcome: (customName?: string) => void;
  dismissWelcome: () => void;
  openNicknameModal: () => void;
  closeNicknameModal: () => void;
  regenerateSuggestedNickname: () => void;
}

const VisitorContext = createContext<VisitorContextValue | undefined>(undefined);

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitorId] = useState<string>(() => getOrCreateVisitorId());
  const [suggestedNickname, setSuggestedNickname] = useState<string>(() => {
    const existing = getStoredVisitorNickname();
    return existing || generateRandomNickname();
  });
  const [nickname, setNicknameState] = useState<string>(() => {
    const existing = getStoredVisitorNickname();
    if (existing) {
      persistNickname(existing);
      return existing;
    }
    return '';
  });
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState<boolean>(() => {
    if (getStoredVisitorNickname() && loadWelcomeSeen()) return true;
    return loadWelcomeSeen();
  });
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);

  const resolvedNickname = nickname || suggestedNickname;

  const setNickname = useCallback((nextName: string) => {
    const cleaned = nextName.trim().slice(0, 32);
    const finalName = cleaned || generateRandomNickname();
    setNicknameState(finalName);
    setSuggestedNickname(finalName);
    persistNickname(finalName);
  }, []);

  const completeWelcome = useCallback(
    (customName?: string) => {
      const cleaned = (customName || '').trim().slice(0, 32);
      const finalName = cleaned || suggestedNickname || generateRandomNickname();
      setNicknameState(finalName);
      setSuggestedNickname(finalName);
      setHasCompletedWelcome(true);
      setIsNicknameModalOpen(false);
      persistNickname(finalName);
      persistWelcomeSeen();
    },
    [suggestedNickname],
  );

  const dismissWelcome = useCallback(() => {
    const finalName = nickname || suggestedNickname || generateRandomNickname();
    setNicknameState(finalName);
    setSuggestedNickname(finalName);
    setHasCompletedWelcome(true);
    setIsNicknameModalOpen(false);
    persistNickname(finalName);
    persistWelcomeSeen();
  }, [nickname, suggestedNickname]);

  const openNicknameModal = useCallback(() => {
    setIsNicknameModalOpen(true);
  }, []);

  const closeNicknameModal = useCallback(() => {
    setIsNicknameModalOpen(false);
  }, []);

  const regenerateSuggestedNickname = useCallback(() => {
    setSuggestedNickname(generateRandomNickname());
  }, []);

  const value = useMemo<VisitorContextValue>(
    () => ({
      visitorId,
      nickname: resolvedNickname,
      suggestedNickname,
      hasCompletedWelcome,
      isNicknameModalOpen,
      setNickname,
      completeWelcome,
      dismissWelcome,
      openNicknameModal,
      closeNicknameModal,
      regenerateSuggestedNickname,
    }),
    [
      visitorId,
      resolvedNickname,
      suggestedNickname,
      hasCompletedWelcome,
      isNicknameModalOpen,
      setNickname,
      completeWelcome,
      dismissWelcome,
      openNicknameModal,
      closeNicknameModal,
      regenerateSuggestedNickname,
    ],
  );

  return (
    <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>
  );
}

export function useVisitor(): VisitorContextValue {
  const ctx = useContext(VisitorContext);
  if (!ctx) {
    throw new Error('useVisitor must be used within a VisitorProvider');
  }
  return ctx;
}

/**
 * Optional hook for components that may be rendered in isolated tests
 * outside VisitorProvider. Falls back to localStorage helpers gracefully.
 */
export function useOptionalVisitor(): VisitorContextValue | null {
  return useContext(VisitorContext) ?? null;
}
