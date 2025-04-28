'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const { login, logout, user, loading } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email);
      // O alerta é mostrado na função login
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Conectado como:</p>
            <p className="font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </div>
    );
  }

  if (!showLoginForm) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">Faça login para sincronizar seus lembretes na nuvem</p>
          <button
            onClick={() => setShowLoginForm(true)}
            className="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold mb-4">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="seu@email.com"
            required
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setShowLoginForm(false)}
            className="text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Enviando...' : 'Enviar link de login'}
          </button>
        </div>
      </form>
    </div>
  );
}
