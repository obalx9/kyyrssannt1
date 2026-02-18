import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Store } from 'lucide-react';
import KursatLogo from '../components/KursatLogo';
import TelegramLogin from '../components/TelegramLogin';
import LanguageSelector from '../components/LanguageSelector';

export default function SellerRegistrationPage() {
  const navigate = useNavigate();
  const { user, loading, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const sellerResponse = await fetch(`${supabaseUrl}/rest/v1/sellers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: user!.id,
          business_name: businessName,
          description: description,
          is_approved: false,
        })
      });

      if (!sellerResponse.ok) {
        const error = await sellerResponse.text();
        throw new Error(error);
      }

      const roleResponse = await fetch(`${supabaseUrl}/rest/v1/user_roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          user_id: user!.id,
          role: 'seller',
        })
      });

      // Ignore duplicate key errors
      if (!roleResponse.ok && roleResponse.status !== 409) {
        const error = await roleResponse.text();
        if (!error.includes('duplicate')) {
          throw new Error(error);
        }
      }

      // Update auth user metadata with new roles
      const updateRolesResponse = await fetch(
        `${supabaseUrl}/functions/v1/update-user-roles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: user!.id }),
        }
      );

      if (!updateRolesResponse.ok) {
        throw new Error('Failed to update user roles');
      }

      // Refresh user data
      await refreshUser();
      navigate('/seller/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register as seller');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('backToLogin')}
            </button>
            <LanguageSelector />
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center mb-8">
              <KursatLogo size={56} color="#0d9488" className="mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('sellerRegTitle')}</h1>
              <p className="text-gray-600 text-center mb-6">
                {t('sellerRegSignIn')}
              </p>
            </div>

            <TelegramLogin />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToLogin')}
          </button>
          <LanguageSelector />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mb-4">
              <Store className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('sellerRegTitle')}</h1>
            <p className="text-gray-600 text-center">
              {t('sellerRegSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                {t('businessName')} *
              </label>
              <input
                type="text"
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder={t('businessNamePlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                {t('description')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !businessName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {submitting ? t('loading') : t('submitApplication')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
