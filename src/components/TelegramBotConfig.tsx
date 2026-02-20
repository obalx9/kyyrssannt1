import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Send, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface TelegramBotConfigProps {
  courseId: string;
  onClose: () => void;
}

interface TelegramBot {
  id: string;
  bot_token: string;
  bot_username: string;
  webhook_secret: string;
  is_active: boolean;
}

export default function TelegramBotConfig({ courseId, onClose }: TelegramBotConfigProps) {
  const { t } = useLanguage();
  const [bot, setBot] = useState<TelegramBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  useEffect(() => {
    loadBot();
  }, [courseId]);

  const loadBot = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/courses/${courseId}/telegram-bot`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setLoading(false);
          return;
        }
        throw new Error('Failed to load bot');
      }

      const data = await response.json();
      if (data) {
        setBot(data);
        setBotToken(data.bot_token);
        if (data.webhook_secret) {
          setWebhookSecret(data.webhook_secret);
          const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
          setWebhookUrl(`${apiUrl}/api/telegram/webhook/${data.webhook_secret}`);
        }
      }
    } catch (err: any) {
      console.error('Error loading bot:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!botToken.trim()) {
      setError(t('botTokenRequired') || 'Bot token is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );
      const data = await response.json();

      if (!data.ok) {
        throw new Error(t('invalidBotToken') || 'Invalid bot token');
      }

      const botUsername = data.result.username;

      const saveResponse = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/courses/${courseId}/telegram-bot`,
        {
          method: bot ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            bot_token: botToken,
            bot_username: botUsername,
            is_active: true,
          }),
        }
      );

      if (!saveResponse.ok) {
        throw new Error('Failed to save bot');
      }

      const savedBot = await saveResponse.json();

      if (!savedBot.webhook_secret) {
        throw new Error('Server did not return webhook_secret. Please try again.');
      }

      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const newWebhookUrl = `${apiUrl}/api/telegram/webhook/${savedBot.webhook_secret}`;

      const webhookResponse = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(newWebhookUrl)}`
      );

      const webhookData = await webhookResponse.json();
      if (!webhookData.ok) {
        throw new Error(`Failed to set webhook: ${webhookData.description}`);
      }

      setWebhookUrl(newWebhookUrl);
      setWebhookSecret(savedBot.webhook_secret);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving bot:', err);
      setError(err.message || t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!bot || !confirm(t('confirmDeactivate'))) return;

    setSaving(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/courses/${courseId}/telegram-bot`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to deactivate bot');
      }

      await fetch(
        `https://api.telegram.org/bot${bot.bot_token}/deleteWebhook`
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error deactivating bot:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('telegramBotConfig') || 'Telegram Bot Configuration'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p className="font-medium">{t('setupInstructions')}:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>{t('step1')}</li>
                  <li>{t('step2')}</li>
                  <li>{t('step3')}</li>
                  <li>{t('step4')}</li>
                  <li>{t('step5')}</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800 dark:text-green-200 space-y-2 w-full">
                <p className="font-medium">{t('importInstructions')}:</p>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-300 dark:border-green-700">
                  <label className="block text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                    {t('courseId') || 'Course ID'}:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={courseId}
                      readOnly
                      className="flex-1 px-3 py-1.5 text-xs font-mono border border-green-300 dark:border-green-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded"
                    />
                    <button
                      onClick={() => copyToClipboard(courseId)}
                      className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                      title={t('copy') || 'Copy'}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <ol className="list-decimal ml-4 space-y-1">
                  <li>{t('importStep1')}</li>
                  <li>{t('importStep2')}</li>
                  <li>{t('importStep3')}</li>
                  <li>{t('importStep4')}</li>
                </ol>
                <p className="text-xs italic mt-2">
                  {t('importNote')}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('botToken') || 'Bot Token'}
            </label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {bot?.bot_username && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('botUsername') || 'Bot Username'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`@${bot.bot_username}`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                />
                <a
                  href={`https://t.me/${bot.bot_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('webhookUrl') || 'Webhook URL'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webhookUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
              />
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('webhookNote') || 'This is set automatically when you save'}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">
                {t('savedSuccessfully') || 'Saved successfully'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {bot?.is_active && (
              <button
                onClick={handleDeactivate}
                disabled={saving}
                className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {t('deactivate') || 'Deactivate'}
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !botToken.trim()}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors"
            >
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
