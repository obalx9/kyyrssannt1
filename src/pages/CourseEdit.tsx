import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { ArrowLeft, Save, Eye, EyeOff, Settings, Search, Upload, X, Users, Send, ExternalLink, Palette, Copy, Check } from 'lucide-react';
import CourseFeed from '../components/CourseFeed';
import ThemeToggle from '../components/ThemeToggle';
import FileUpload from '../components/FileUpload';
import AdvancedThemeCustomizer from '../components/AdvancedThemeCustomizer';
import ThemePreview from '../components/ThemePreview';
import { themePresets, mergeThemeConfig, type ThemeConfig, getDefaultTheme } from '../utils/themePresets';

interface Course {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  seller_id: string;
  thumbnail_url: string | null;
  autoplay_videos: boolean;
  reverse_post_order: boolean;
  show_post_dates: boolean;
  show_lesson_numbers: boolean;
  compact_view: boolean;
  allow_downloads: boolean;
  theme_preset: string | null;
  theme_config: ThemeConfig | null;
  watermark: string | null;
}

export default function CourseEdit() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'feed' | 'settings' | 'design'>('feed');
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [autoplayVideos, setAutoplayVideos] = useState(false);
  const [reversePostOrder, setReversePostOrder] = useState(false);
  const [showPostDates, setShowPostDates] = useState(false);
  const [showLessonNumbers, setShowLessonNumbers] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [allowDownloads, setAllowDownloads] = useState(true);
  const [watermark, setWatermark] = useState('');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(getDefaultTheme().config);
  const [previewPosts, setPreviewPosts] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.roles.includes('seller'))) {
      navigate('/login');
      return;
    }

    if (user && courseId) {
      loadCourse();
      loadPreviewPosts();
    }
  }, [user, loading, courseId, navigate]);

  const loadPreviewPosts = async () => {
    if (!courseId) return;
    try {
      const token = localStorage.getItem('token');
      if (token) apiClient.setToken(token);
      const data = await apiClient.getCoursePosts(courseId, 3, 0);
      setPreviewPosts(data || []);
    } catch (error) {
      console.error('Error loading preview posts:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      apiClient.setToken(token);

      const courseData = await apiClient.getCourse(courseId!);

      if (!courseData) {
        alert(t('courseNotFound'));
        navigate('/seller/dashboard');
        return;
      }

      setCourse(courseData);
      setTitle(courseData.title);
      setDescription(courseData.description || '');
      setIsPublished(courseData.is_published);
      setThumbnailUrl(courseData.thumbnail_url);
      setAutoplayVideos(courseData.autoplay_videos || false);
      setReversePostOrder(courseData.reverse_post_order || false);
      setShowPostDates(courseData.show_post_dates || false);
      setShowLessonNumbers(courseData.show_lesson_numbers != null ? courseData.show_lesson_numbers : true);
      setCompactView(courseData.compact_view || false);
      setAllowDownloads(courseData.allow_downloads != null ? courseData.allow_downloads : true);
      setWatermark(courseData.watermark || '');

      if (courseData.theme_config) {
        setThemeConfig(mergeThemeConfig(courseData.theme_config));
      } else if (courseData.theme_preset) {
        const preset = themePresets.find(p => p.id === courseData.theme_preset);
        if (preset) {
          setThemeConfig(preset.config);
        }
      }
    } catch (error) {
      console.error('Error loading course:', error);
      alert(t('failedToLoad') + ' ' + t('courseDetails').toLowerCase());
      navigate('/seller/dashboard');
    } finally {
      setLoadingData(false);
    }
  };


  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!courseId) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);

      await apiClient.updateCourse(courseId, {
        title,
        description,
        is_published: isPublished,
        theme_config: themeConfig,
        watermark_text: watermark || undefined,
      } as any);

      alert(t('courseUpdated'));
    } catch (error) {
      console.error('Error updating course:', error);
      alert(t('failedToUpdate') + ' ' + t('courseDetails').toLowerCase());
    } finally {
      setSaving(false);
    }
  };

  const handleThumbnailUpload = (storagePath: string, _fileSize: number, _fileName: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const thumbnailFullUrl = `${apiUrl}/uploads/${storagePath}`;
    setThumbnailUrl(thumbnailFullUrl);
    setUploadingThumbnail(false);
  };

  const handleRemoveThumbnail = async () => {
    if (!thumbnailUrl || !confirm(t('deleteMediaConfirm'))) return;
    setThumbnailUrl(null);
  };

  const handleCopyId = async () => {
    if (!courseId) return;
    try {
      await navigator.clipboard.writeText(courseId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch (error) {
      console.error('Error copying ID:', error);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-md bg-opacity-95 dark:bg-opacity-95 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => navigate('/seller/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900 dark:text-gray-100" />
              </button>
              <div className={`min-w-0 transition-all duration-300 ${isScrolled ? 'max-w-[200px]' : ''}`}>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{t('editCourse')}</h1>
                {!isScrolled && <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{course?.title}</p>}
              </div>
            </div>
            <div className={`flex-1 max-w-md transition-all duration-300 ${isScrolled && activeTab === 'feed' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPosts')}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/course/${courseId}`)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={t('viewAsCourseStudent')}
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden lg:inline">{t('preview')}</span>
              </button>
              <button
                onClick={() => navigate(`/seller/course/${courseId}/students`)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={t('manageStudents')}
              >
                <Users className="w-4 h-4" />
                <span className="hidden lg:inline">{t('manageStudents')}</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 px-4 sm:px-6 py-3 font-medium whitespace-nowrap transition-colors snap-start touch-manipulation ${
                activeTab === 'feed'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {t('coursePosts')}
            </button>
            <button
              onClick={() => setActiveTab('design')}
              className={`flex-1 px-4 sm:px-6 py-3 font-medium whitespace-nowrap transition-colors snap-start touch-manipulation ${
                activeTab === 'design'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Palette className="w-4 h-4" />
                {t('design')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 px-4 sm:px-6 py-3 font-medium whitespace-nowrap transition-colors snap-start touch-manipulation ${
                activeTab === 'settings'
                  ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 justify-center">
                <Settings className="w-4 h-4" />
                {t('courseDetails')}
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 max-w-3xl">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{t('courseDetails')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('businessName')} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 text-[16px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('courseId')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={courseId}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">{t('idCopied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">{t('copyId')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('courseThumbnail')}
                </label>
                {thumbnailUrl ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt={t('courseThumbnailAlt')}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      {t('delete')}
                    </button>
                  </div>
                ) : uploadingThumbnail ? (
                  <FileUpload
                    courseId={courseId!}
                    onUploadComplete={handleThumbnailUpload}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setUploadingThumbnail(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-400 transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    {t('uploadThumbnail')}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isPublished
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <Eye className="w-4 h-4" />
                      {t('published')}
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      {t('draft')}
                    </>
                  )}
                </button>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'feed' && courseId && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <CourseFeed
                courseId={courseId}
                editable={true}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                hideInlineSearch={isScrolled}
                courseSettings={{
                  autoplay_videos: autoplayVideos,
                  reverse_post_order: reversePostOrder,
                  show_post_dates: showPostDates,
                  show_lesson_numbers: showLessonNumbers,
                  compact_view: compactView,
                  allow_downloads: allowDownloads,
                  watermark: watermark,
                }}
                themeConfig={themeConfig}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {t('displaySettings')}
                </h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoplayVideos}
                      onChange={(e) => setAutoplayVideos(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('autoplayVideos')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('autoplayVideosDesc')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reversePostOrder}
                      onChange={(e) => setReversePostOrder(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('reversePostOrder')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('reversePostOrderDesc')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPostDates}
                      onChange={(e) => setShowPostDates(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('showPostDates')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('showPostDatesDesc')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLessonNumbers}
                      onChange={(e) => setShowLessonNumbers(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('showLessonNumbers')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('showLessonNumbersDesc')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compactView}
                      onChange={(e) => setCompactView(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('compactView')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('compactViewDesc')}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowDownloads}
                      onChange={(e) => setAllowDownloads(e.target.checked)}
                      className="mt-1 w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {t('allowDownloads')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('allowDownloadsDesc')}
                      </div>
                    </div>
                  </label>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <label className="block">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                        {t('watermark')}
                      </div>
                      <input
                        type="text"
                        value={watermark}
                        onChange={(e) => setWatermark(e.target.value)}
                        placeholder={t('watermarkPlaceholder')}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {t('watermarkDesc')}
                      </div>
                    </label>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleSave()}
                      disabled={saving}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? t('loading') : t('saveSettings')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('themeCustomization')}
              </h2>
              <AdvancedThemeCustomizer
                config={themeConfig}
                onChange={setThemeConfig}
              />
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-5 h-5" />
                  {saving ? t('loading') : t('saveDesign')}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {t('preview')}
              </h2>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t('previewDescription')}
                </div>
                <ThemePreview
                  config={themeConfig}
                  courseName={title || 'Название курса'}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
