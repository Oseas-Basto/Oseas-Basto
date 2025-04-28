
'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

// Definindo a interface para o contexto de autenticação
interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<any>; // Simplificado para Magic Link por enquanto
  logout: () => Promise<void>;
}

// Criando o contexto de autenticação
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provedor de autenticação
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Efeito para carregar a sessão inicial e ouvir mudanças
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Limpar o listener ao desmontar
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Função de login (Magic Link)
  const login = async (email: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Opcional: redirecionar após o login
          // emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      alert('Verifique seu e-mail para o link de login!');
    } catch (error) {
      console.error('Erro no login:', error);
      alert(`Erro no login: ${error instanceof Error ? error.message : error}`);
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto de autenticação
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

