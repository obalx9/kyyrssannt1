import { useEffect, useState } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramBotConfig {
  botUsername: string;
  botToken: string;
  channelId: string;
  isActive: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TelegramAuth() {
  const [botConfig, setBotConfig] = useState<TelegramBotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchBotConfig();
    checkAuth();
  }, []);

  const fetchBotConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/telegram-bot`);
      if (!response.ok) {
        throw new Error('Telegram bot not configured');
      }
      const data = await response.json();
      setBotConfig(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bot config');
      setLoading(false);
    }
  };

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser(token);
    }
  };

  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        localStorage.removeItem('token');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    }
  };

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          photo_url: telegramUser.photo_url,
          hash: telegramUser.hash
        })
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  };

  useEffect(() => {
    if (botConfig) {
      (window as any).onTelegramAuth = handleTelegramAuth;

      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botConfig.botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;

      const container = document.getElementById('telegram-login-button');
      if (container) {
        container.innerHTML = '';
        container.appendChild(script);
      }
    }
  }, [botConfig]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Ошибка конфигурации</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-center">
            {user.photo_url && (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-500"
              />
            )}
            <h2 className="text-2xl font-bold mb-2">
              Привет, {user.first_name}!
            </h2>
            {user.telegram_username && (
              <p className="text-gray-600 mb-1">@{user.telegram_username}</p>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Telegram ID: {user.telegram_id}
            </p>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {user.roles?.join(', ') || 'student'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Войти через Telegram</h2>
          <p className="text-gray-600 mb-6">
            Используйте Telegram для быстрого входа на платформу
          </p>
          <div id="telegram-login-button" className="flex justify-center"></div>
          <p className="mt-4 text-xs text-gray-500">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  );
}
