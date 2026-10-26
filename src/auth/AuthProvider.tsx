import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { MockUser, onAuthChanged, signInWithEmail, signInWithGoogle, signOut, signUp } from '../firebase';

type AuthCtx = {
  user: MockUser | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  signUpWithRole: (email: string, password: string, role: 'trainer' | 'rider') => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginEmail = async (email: string, password: string) => {
    await signInWithEmail(email, password);
  };
  const loginGoogle = async () => {
    await signInWithGoogle();
  };
  const signUpWithRole = async (email: string, password: string, role: 'trainer' | 'rider') => {
    await signUp(email, password, role);
  };
  const logout = async () => {
    await signOut();
  };

  return (
    <Ctx.Provider value={{ user, loading, loginEmail, loginGoogle, signUpWithRole, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
