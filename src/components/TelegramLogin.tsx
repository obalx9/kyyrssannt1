import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { Send } from 'lucide-react';

interface TelegramLoginProps {
  onSuccess?: () => void;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function TelegramLogin({ onSuccess }: TelegramLoginProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const loadBotConfig = async () => {
      try {
        const data = await apiClient.getTelegramBot();
        if (data?.bot_username) {
          setBotUsername(data.bot_username);
        }
      } catch (err) {
        console.error('Error loading bot config:', err);
      }
    };

    loadBotConfig();
  }, []);

  useEffect(() => {
    if (!botUsername || scriptLoadedRef.current) return;

    scriptLoadedRef.current = true;

    window.onTelegramAuth = async (user: any) => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiClient.telegramAuth(user);

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.token && data.user) {
          if (onSuccess) {
            onSuccess();
          }
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err: any) {
        console.error('Telegram auth error:', err);
        setError(err.message || t('authError'));
      } finally {
        setLoading(false);
      }
    };

    const container = containerRef.current;
    if (!container) return;

    const existingScripts = container.getElementsByTagName('script');
    while (existingScripts.length > 0) {
      existingScripts[0].remove();
    }
    const existingIframes = container.getElementsByTagName('iframe');
    while (existingIframes.length > 0) {
      existingIframes[0].remove();
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    container.appendChild(script);

    return () => {
      scriptLoadedRef.current = false;
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
      delete window.onTelegramAuth;
    };
  }, [botUsername, onSuccess, t]);

  if (!botUsername) {
    return (
      <div className="text-center py-4 text-gray-600 dark:text-gray-400">
        {t('configureTelegramBot')}
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={containerRef}
          className="flex justify-center"
          style={{ pointerEvents: loading ? 'none' : 'auto', opacity: loading ? 0.5 : 1 }}
        ></div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
