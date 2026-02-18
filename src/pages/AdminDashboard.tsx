import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Users, Store, BookOpen, LogOut, Check, X } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';

interface PendingSeller {
  id: string;
  business_name: string;
  description: string;
  is_approved: boolean;
  user: {
    first_name: string;
    last_name: string;
    telegram_username: string;
  };
}

interface Stats {
  totalUsers: number;
  totalSellers: number;
  totalCourses: number;
  pendingSellers: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSellers: 0,
    totalCourses: 0,
    pendingSellers: 0,
  });
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('super_admin'))) {
      navigate('/login');
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, loading, navigate]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoadingData(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const [usersRes, sellersRes, coursesRes, pendingRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/users?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/sellers?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/courses?select=id&limit=1`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`,
            'Prefer': 'count=exact'
          }
        }),
        fetch(`${supabaseUrl}/rest/v1/sellers?is_approved=eq.false&select=id,business_name,description,is_approved,user:users!sellers_user_id_fkey(first_name,last_name,telegram_username)`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      const getUsersCount = () => {
        const count = usersRes.headers.get('Content-Range');
        return count ? parseInt(count.split('/')[1]) : 0;
      };

      const getSellersCount = () => {
        const count = sellersRes.headers.get('Content-Range');
        return count ? parseInt(count.split('/')[1]) : 0;
      };

      const getCoursesCount = () => {
        const count = coursesRes.headers.get('Content-Range');
        return count ? parseInt(count.split('/')[1]) : 0;
      };

      const pendingData = await pendingRes.json();

      setStats({
        totalUsers: getUsersCount(),
        totalSellers: getSellersCount(),
        totalCourses: getCoursesCount(),
        pendingSellers: pendingData?.length || 0,
      });

      setPendingSellers(pendingData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApproveSeller = async (sellerId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/sellers?id=eq.${sellerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_approved: true })
      });

      if (!response.ok) throw new Error('Failed to approve seller');

      setPendingSellers(pendingSellers.filter(s => s.id !== sellerId));
      setStats(prev => ({
        ...prev,
        pendingSellers: prev.pendingSellers - 1,
      }));
    } catch (error) {
      console.error('Error approving seller:', error);
      alert(t('failedToApproveSeller'));
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    if (!confirm(t('rejectSellerConfirm'))) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/rest/v1/sellers?id=eq.${sellerId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to reject seller');

      setPendingSellers(pendingSellers.filter(s => s.id !== sellerId));
      setStats(prev => ({
        ...prev,
        pendingSellers: prev.pendingSellers - 1,
      }));
    } catch (error) {
      console.error('Error rejecting seller:', error);
      alert(t('failedToRejectSeller'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">{t('adminDashboard')}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 hidden sm:block">{t('adminWelcome')}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <ThemeToggle />
              <LanguageSelector />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('totalUsers')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('activeUsers')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSellers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('myCourses')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{t('pending')}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingSellers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('pendingApplications')}</h2>

          {pendingSellers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400">{t('noPendingApplications')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSellers.map((seller) => (
                <div
                  key={seller.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">{seller.business_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {seller.user?.first_name} {seller.user?.last_name} (@
                        {seller.user?.telegram_username || '?'})
                      </p>
                      {seller.description && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">{seller.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApproveSeller(seller.id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 p-2.5 sm:p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors touch-manipulation"
                        title={t('approve')}
                      >
                        <Check className="w-5 h-5" />
                        <span className="sm:hidden text-sm font-medium">{t('approve')}</span>
                      </button>
                      <button
                        onClick={() => handleRejectSeller(seller.id)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-2 p-2.5 sm:p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors touch-manipulation"
                        title={t('reject')}
                      >
                        <X className="w-5 h-5" />
                        <span className="sm:hidden text-sm font-medium">{t('reject')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
