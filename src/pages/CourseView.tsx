import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { ArrowLeft, BookOpen, Search, Maximize2, ArrowDown } from 'lucide-react';
import CourseFeed from '../components/CourseFeed';
import PinnedPostsSidebar from '../components/PinnedPostsSidebar';
import ThemeToggle from '../components/ThemeToggle';
import BackgroundEmojiPattern from '../components/BackgroundEmojiPattern';
import ContentProtectionWarning from '../components/ContentProtectionWarning';
import { useLanguage } from '../contexts/LanguageContext';
import { useScrollPreferences } from '../contexts/ScrollPreferencesContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemePreset, getDefaultTheme, type ThemeConfig } from '../utils/themePresets';
import { getBackgroundStyleProperty, getGlassEffect, getGlassEffectDark } from '../utils/postStyles';
import {
  applyBasicProtection,
  startDynamicWatermark,
  startDevToolsDetection,
  detectScreenRecording
} from '../utils/contentProtection';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  autoplay_videos: boolean;
  reverse_post_order: boolean;
  show_post_dates: boolean;
  show_lesson_numbers: boolean;
  compact_view: boolean;
  allow_downloads: boolean;
  theme_preset: string | null;
  theme_config: ThemeConfig | null;
  seller_id: string;
  watermark: string | null;
}

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { snapEnabled, toggleSnap } = useScrollPreferences();
  const [course, setCourse] = useState<Course | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrollToPostId, setScrollToPostId] = useState<((postId: string) => void) | null>(null);
  const [pinnedCount, setPinnedCount] = useState(0);

  const handleScrollToPostReady = (fn: (postId: string) => void) => {
    setScrollToPostId(() => fn);
  };
  const [showPinnedSidebar, setShowPinnedSidebar] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    if (user && courseId) {
      checkAccessAndLoadCourse();
    }
  }, [user, loading, courseId, navigate]);

  useEffect(() => {
    if (!course || !user) return;

    const cleanupProtection = applyBasicProtection();

    const studentName = user.first_name
      ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
      : user.telegram_username
      ? `@${user.telegram_username}`
      : 'Student';

    const watermarkText = course.watermark
      ? `${course.watermark} | ${studentName}`
      : studentName;

    const cleanupWatermark = startDynamicWatermark({
      text: watermarkText,
      opacity: 0.15,
      fontSize: 18,
      color: '#ffffff'
    });

    const cleanupDevTools = startDevToolsDetection(() => {
      alert('Developer tools detected! This content is protected.');
    });

    const cleanupScreenRecording = detectScreenRecording(() => {
      alert('Screen recording detected! This content is protected.');
    });

    return () => {
      cleanupProtection();
      cleanupWatermark();
      cleanupDevTools();
      cleanupScreenRecording();
    };
  }, [course, user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    const handleTogglePinnedSidebar = () => {
      setShowPinnedSidebar(prev => !prev);
    };

    const handleToggleMobileSearch = () => {
      setShowSearch(prev => !prev);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('togglePinnedSidebar', handleTogglePinnedSidebar);
    window.addEventListener('toggleMobileSearch', handleToggleMobileSearch);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('togglePinnedSidebar', handleTogglePinnedSidebar);
      window.removeEventListener('toggleMobileSearch', handleToggleMobileSearch);
    };
  }, []);

  const checkAccessAndLoadCourse = async () => {
    if (!courseId || !user) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
      }

      const courseData = await apiClient.getCourse(courseId);

      if (!courseData) {
        alert(t('courseNotFound'));
        const isSeller = user?.roles.includes('seller');
        navigate(isSeller ? '/seller/dashboard' : '/dashboard');
        return;
      }

      const isSeller = user.roles.includes('seller');
      const isAdmin = user.roles.includes('super_admin');
      let courseOwner = false;

      if (isSeller || isAdmin) {
        try {
          const sellerProfile = await apiClient.getSellerProfile();
          courseOwner = sellerProfile && sellerProfile.id === courseData.seller_id;
        } catch {
          courseOwner = false;
        }
      }

      let isStudent = false;
      if (!courseOwner) {
        try {
          const enrollments = await apiClient.getStudentEnrollments();
          isStudent = Array.isArray(enrollments) && enrollments.some((e: any) => e.id === courseId);
        } catch {
          isStudent = false;
        }
      }

      if (!courseOwner && !isStudent) {
        if (!isSeller && !isAdmin) {
          alert(t('noAccessToCourse'));
          navigate('/dashboard');
          return;
        }
      }

      setHasAccess(true);
      setIsOwner(courseOwner);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
      const isSeller = user?.roles.includes('seller');
      navigate(isSeller ? '/seller/dashboard' : '/dashboard');
    } finally {
      setLoadingCourse(false);
    }
  };

  if (loading || loadingCourse) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasAccess || !course) {
    return null;
  }

  const themeConfig = course.theme_config
    ? course.theme_config
    : (course.theme_preset ? getThemePreset(course.theme_preset)?.config : getDefaultTheme().config);

  const backgroundGradient = theme === 'dark'
    ? (themeConfig?.background.dark || 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)')
    : (themeConfig?.background.light || 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)');

  const headerTheme = theme === 'dark' ? themeConfig?.header.dark : themeConfig?.header.light;
  const isAnimatedGradient = themeConfig?.background.type === 'animated-gradient';

  return (
    <div className="min-h-screen relative">
      <ContentProtectionWarning courseName={course.title} />
      <div
        className={`fixed inset-0 -z-10 ${isAnimatedGradient ? 'animate-gradient' : ''}`}
        style={{
          background: backgroundGradient,
          backgroundAttachment: 'fixed',
          backgroundSize: isAnimatedGradient ? '200% 200%' : 'auto'
        }}
      />
      {themeConfig?.posts.emojiPattern && (
        <BackgroundEmojiPattern pattern={themeConfig.posts.emojiPattern} />
      )}
      <div className="relative z-10">
      <header
        className="sticky top-0 z-50 backdrop-blur-md transition-all duration-300"
        style={{
          backgroundColor: headerTheme?.bg ? `rgba(${parseInt(headerTheme.bg.slice(1,3), 16)}, ${parseInt(headerTheme.bg.slice(3,5), 16)}, ${parseInt(headerTheme.bg.slice(5,7), 16)}, ${headerTheme.bgOpacity})` : 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          color: headerTheme?.text || '#0f172a'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => navigate(isOwner ? '/seller/dashboard' : '/dashboard')}
              className="p-2 rounded-lg transition-all hover:opacity-70"
              style={{ opacity: 0.8 }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: headerTheme?.text }} />
            </button>
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: headerTheme?.text, opacity: 0.1 }}
              >
                <BookOpen className="w-4 h-4 md:w-6 md:h-6" style={{ color: headerTheme?.text }} />
              </div>
              <div className={`transition-all duration-300 min-w-0 flex-1 ${isScrolled ? 'md:max-w-[200px]' : ''}`}>
                <h1 className="text-base md:text-xl font-bold truncate" style={{ color: headerTheme?.text }}>{course.title}</h1>
                {!isScrolled && <p className="text-xs md:text-sm truncate hidden sm:block" style={{ color: headerTheme?.text, opacity: 0.7 }}>{course.description}</p>}
              </div>
            </div>
            <div className={`hidden md:flex flex-1 max-w-md transition-all duration-300 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: headerTheme?.text, opacity: 0.5 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPosts')}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: headerTheme?.bg,
                    color: headerTheme?.text,
                    borderColor: `${headerTheme?.text}33`,
                    opacity: 0.9
                  }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!showSearch && (
                <button
                  onClick={() => setShowSearch(true)}
                  className="md:hidden p-2 rounded-lg transition-all hover:opacity-70 touch-manipulation"
                  style={{ opacity: 0.8 }}
                >
                  <Search className="w-5 h-5" style={{ color: headerTheme?.text }} />
                </button>
              )}
              <ThemeToggle />
            </div>
            {showSearch && (
              <div className="md:hidden flex-1 min-w-0 animate-fade-in">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: headerTheme?.text, opacity: 0.5 }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setShowSearch(false);
                    }}
                    autoFocus
                    placeholder={t('searchPosts')}
                    className="w-full pl-9 pr-3 py-2 text-[16px] border rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    style={{
                      backgroundColor: headerTheme?.bg,
                      color: headerTheme?.text,
                      borderColor: `${headerTheme?.text}33`,
                      opacity: 0.9
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className={`sticky transition-all duration-300 space-y-4 ${
              isScrolled ? 'top-[88px]' : 'top-[104px]'
            }`}>
              <PinnedPostsSidebar
                key={pinnedCount}
                courseId={course.id}
                onPostClick={(postId) => {
                  scrollToPostId?.(postId);
                }}
                themeConfig={themeConfig}
              />

              <div
                className="rounded-lg p-4 transition-colors"
                style={{
                  ...getBackgroundStyleProperty(
                    theme === 'dark'
                      ? (themeConfig?.posts.dark.bg || '#1f2937')
                      : (themeConfig?.posts.light.bg || '#ffffff'),
                    theme === 'dark'
                      ? (themeConfig?.posts.dark.bgOpacity ?? 1)
                      : (themeConfig?.posts.light.bgOpacity ?? 1)
                  ),
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme === 'dark'
                    ? themeConfig?.posts.dark.border
                    : themeConfig?.posts.light.border,
                  color: theme === 'dark'
                    ? themeConfig?.posts.dark.text
                    : themeConfig?.posts.light.text
                }}
              >
                <button
                  onClick={() => {
                    window.scrollTo({
                      top: document.body.scrollHeight,
                      behavior: 'smooth'
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={theme === 'dark' ? getGlassEffectDark('medium') : getGlassEffect('medium')}
                >
                  <ArrowDown className="w-4 h-4" />
                  {t('scrollToStart')}
                </button>
              </div>

              <div
                className="rounded-lg p-4 transition-colors"
                style={{
                  ...getBackgroundStyleProperty(
                    theme === 'dark'
                      ? (themeConfig?.posts.dark.bg || '#1f2937')
                      : (themeConfig?.posts.light.bg || '#ffffff'),
                    theme === 'dark'
                      ? (themeConfig?.posts.dark.bgOpacity ?? 1)
                      : (themeConfig?.posts.light.bgOpacity ?? 1)
                  ),
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: theme === 'dark'
                    ? themeConfig?.posts.dark.border
                    : themeConfig?.posts.light.border,
                  color: theme === 'dark'
                    ? themeConfig?.posts.dark.text
                    : themeConfig?.posts.light.text
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 opacity-70" />
                    <div>
                      <h3 className="text-sm font-medium">
                        {t('scrollMode')}
                      </h3>
                      <p className="text-xs opacity-60">
                        {snapEnabled ? 'Snap ON' : 'Snap OFF'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={toggleSnap}
                    className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                    style={
                      snapEnabled
                        ? {
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                          }
                        : (theme === 'dark'
                            ? { ...getGlassEffectDark('light'), backgroundColor: 'rgba(71, 85, 105, 0.5)' }
                            : { ...getGlassEffect('light'), backgroundColor: 'rgba(203, 213, 225, 0.5)' }
                          )
                    }
                  >
                    <span
                      className="inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300"
                      style={{
                        transform: snapEnabled ? 'translateX(22px)' : 'translateX(2px)',
                        marginTop: '4px'
                      }}
                    />
                  </button>
                </div>
                {snapEnabled && (
                  <div className="mt-3 text-xs opacity-70">
                    <p className="mb-2">Используйте клавиши:</p>
                    <ul className="space-y-1">
                      <li>↑/↓ - навигация</li>
                      <li>Space - следующий</li>
                      <li>Home/End - начало/конец</li>
                    </ul>
                  </div>
                )}
              </div>

              {snapEnabled && totalPosts > 0 && (
                <div
                  className="rounded-lg p-4 transition-colors"
                  style={{
                    ...getBackgroundStyleProperty(
                      theme === 'dark'
                        ? (themeConfig?.posts.dark.bg || '#1f2937')
                        : (themeConfig?.posts.light.bg || '#ffffff'),
                      theme === 'dark'
                        ? (themeConfig?.posts.dark.bgOpacity ?? 1)
                        : (themeConfig?.posts.light.bgOpacity ?? 1)
                    ),
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: theme === 'dark'
                      ? themeConfig?.posts.dark.border
                      : themeConfig?.posts.light.border,
                    color: theme === 'dark'
                      ? themeConfig?.posts.dark.text
                      : themeConfig?.posts.light.text
                  }}
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {currentPosition} / {totalPosts}
                    </div>
                    <p className="text-xs opacity-70 mt-1">
                      Позиция в ленте
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1 max-w-2xl">
            <CourseFeed
              courseId={course.id}
              editable={false}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              hideInlineSearch={isScrolled}
              onScrollToPostReady={handleScrollToPostReady}
              onPinnedCountChange={setPinnedCount}
              onPositionChange={(current, total) => {
                setCurrentPosition(current + 1);
                setTotalPosts(total);
              }}
              courseSettings={{
                autoplay_videos: course.autoplay_videos || false,
                reverse_post_order: course.reverse_post_order || false,
                show_post_dates: course.show_post_dates || false,
                show_lesson_numbers: course.show_lesson_numbers != null ? course.show_lesson_numbers : true,
                compact_view: course.compact_view || false,
                allow_downloads: course.allow_downloads != null ? course.allow_downloads : true,
                watermark: course.watermark,
              }}
              themeConfig={themeConfig}
            />
          </div>
        </div>
      </main>

      {showPinnedSidebar && (
        <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={() => setShowPinnedSidebar(false)}>
          <div
            className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-80 shadow-xl overflow-y-auto animate-slide-in-right"
            style={{
              ...getBackgroundStyleProperty(
                theme === 'dark'
                  ? (themeConfig?.posts.dark.bg || '#1f2937')
                  : (themeConfig?.posts.light.bg || '#ffffff'),
                theme === 'dark'
                  ? (themeConfig?.posts.dark.bgOpacity ?? 1)
                  : (themeConfig?.posts.light.bgOpacity ?? 1)
              )
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="p-4 border-b flex items-center justify-between sticky top-0 z-10"
              style={{
                ...getBackgroundStyleProperty(
                  theme === 'dark'
                    ? (themeConfig?.posts.dark.bg || '#1f2937')
                    : (themeConfig?.posts.light.bg || '#ffffff'),
                  theme === 'dark'
                    ? (themeConfig?.posts.dark.bgOpacity ?? 1)
                    : (themeConfig?.posts.light.bgOpacity ?? 1)
                ),
                borderColor: theme === 'dark'
                  ? themeConfig?.posts.dark.border
                  : themeConfig?.posts.light.border,
                color: theme === 'dark'
                  ? themeConfig?.posts.dark.text
                  : themeConfig?.posts.light.text
              }}
            >
              <h2 className="font-semibold">{t('pinnedPosts')}</h2>
              <button
                onClick={() => setShowPinnedSidebar(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <PinnedPostsSidebar
              key={pinnedCount}
              courseId={course.id}
              onPostClick={(postId) => {
                setShowPinnedSidebar(false);
                setTimeout(() => {
                  scrollToPostId?.(postId);
                }, 300);
              }}
              themeConfig={themeConfig}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
