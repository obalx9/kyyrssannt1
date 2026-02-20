import { useEffect, useState, useCallback } from 'react';
import { Pin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../lib/api';
import { ThemeConfig } from '../utils/themePresets';
import { getBackgroundStyleProperty, getGlassEffect, getGlassEffectDark } from '../utils/postStyles';

interface PinnedPost {
  id: string;
  text_content: string | null;
  created_at: string;
}

interface PinnedPostsSidebarProps {
  courseId: string;
  onPostClick?: (postId: string) => void;
  themeConfig?: ThemeConfig;
}

export default function PinnedPostsSidebar({ courseId, onPostClick, themeConfig }: PinnedPostsSidebarProps) {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [pinnedPosts, setPinnedPosts] = useState<PinnedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadPinnedPosts = useCallback(async (_uid: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPinnedPosts([]);
        setLoading(false);
        return;
      }
      apiClient.setToken(token);

      const data = await apiClient.getPinnedPosts(courseId);

      const posts = (data || []).map((p: any) => ({
        id: p.post_id,
        text_content: p.text_content,
        created_at: p.post_created_at || p.created_at,
      }));
      setPinnedPosts(posts);
    } catch (error) {
      console.error('[PinnedPostsSidebar] Error:', error);
      setPinnedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        apiClient.setToken(token);
        const userData = await apiClient.getUser();
        const uid = userData?.id;
        if (!uid) return;
        setUserId(uid);
        loadPinnedPosts(uid);
      } catch (error) {
        console.error('[PinnedPostsSidebar] Failed to get user:', error);
      }
    };

    init();
  }, [loadPinnedPosts]);

  useEffect(() => {
    if (!userId) return;

    // Poll for updates every 10 seconds instead of using realtime
    const interval = setInterval(() => {
      loadPinnedPosts(userId);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [userId, courseId, loadPinnedPosts]);

  const postTheme = theme === 'dark' ? themeConfig?.posts?.dark : themeConfig?.posts?.light;

  const backgroundStyles = getBackgroundStyleProperty(
    theme === 'dark' ? (postTheme?.bg || '#1e293b') : (postTheme?.bg || '#ffffff'),
    postTheme?.bgOpacity ?? 1
  );

  const containerStyle = {
    ...backgroundStyles,
    borderWidth: '1px',
    borderStyle: 'solid' as const,
    borderColor: theme === 'dark'
      ? themeConfig?.posts?.dark?.border || '#475569'
      : themeConfig?.posts?.light?.border || '#cbd5e1',
    color: theme === 'dark'
      ? themeConfig?.posts?.dark?.text || '#f1f5f9'
      : themeConfig?.posts?.light?.text || '#0f172a',
    borderRadius: `${themeConfig?.posts.borderRadius || 12}px`
  };

  if (loading) {
    return (
      <div className="overflow-hidden" style={containerStyle}>
        <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: containerStyle.borderColor }}>
          <Pin className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-semibold">{t('pinnedPosts')}</h2>
        </div>
        <div className="p-4 space-y-2">
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (pinnedPosts.length === 0) {
    return (
      <div className="overflow-hidden" style={containerStyle}>
        <div className="flex items-center gap-2 p-4 border-b" style={{ borderColor: containerStyle.borderColor }}>
          <Pin className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-semibold">{t('pinnedPosts')}</h2>
        </div>
        <div className="p-4">
          <p className="text-sm opacity-70">{t('noPinnedPosts')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden flex flex-col" style={{ ...containerStyle, maxHeight: '600px' }}>
      <div className="flex items-center gap-2 p-4 border-b flex-shrink-0" style={{ borderColor: containerStyle.borderColor }}>
        <Pin className="w-5 h-5 text-teal-500" />
        <h2 className="text-lg font-semibold">{t('pinnedPosts')}</h2>
        <span className="ml-auto text-sm opacity-70">{pinnedPosts.length}</span>
      </div>
      <div className="overflow-y-auto p-4 space-y-2">
        {pinnedPosts.map((post) => (
          <button
            key={post.id}
            onClick={() => onPostClick?.(post.id)}
            className="w-full text-left p-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              ...(theme === 'dark' ? getGlassEffectDark('light') : getGlassEffect('light'))
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2" style={{
                color: theme === 'dark' ? '#f1f5f9' : '#0f172a'
              }}>
                {post.text_content || t('mediaContent')}
              </p>
              <p className="text-xs opacity-70 mt-1" style={{
                color: theme === 'dark' ? '#cbd5e1' : '#64748b'
              }}>
                {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
