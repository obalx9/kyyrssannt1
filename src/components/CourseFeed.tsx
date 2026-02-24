import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useScrollPreferences } from '../contexts/ScrollPreferencesContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiClient } from '../lib/api';
import { Search, Video, Calendar, Edit2, Trash2, X, Save, Upload, Plus, AlertTriangle, ArrowUp, ArrowDown, Pin } from 'lucide-react';
import FileUpload from './FileUpload';
import MediaModal from './MediaModal';
import MediaThumbnail from './MediaThumbnail';
import ConfirmDialog from './ConfirmDialog';
import VoicePlayer from './VoicePlayer';
import { getPostStyles } from '../utils/postStyles';
import type { ThemeConfig } from '../utils/themePresets';
import MediaGallery, { MediaItem } from './MediaGallery';
import MediaGroupEditor from './MediaGroupEditor';

interface CoursePost {
  id: string;
  course_id: string;
  source_type: 'telegram' | 'manual';
  title: string;
  text_content: string;
  media_type: string | null;
  media_group_id?: string | null;
  media_count?: number;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  telegram_file_id: string | null;
  telegram_thumbnail_file_id: string | null;
  telegram_media_width: number | null;
  telegram_media_height: number | null;
  has_error: boolean;
  error_message: string | null;
  published_at: string;
  created_at: string;
  media_items?: MediaItem[];
}

interface CourseSettings {
  autoplay_videos: boolean;
  reverse_post_order: boolean;
  show_post_dates: boolean;
  show_lesson_numbers: boolean;
  compact_view: boolean;
  allow_downloads: boolean;
  watermark?: string | null;
}

interface CourseFeedProps {
  courseId: string;
  editable?: boolean;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  hideInlineSearch?: boolean;
  onScrollToPostReady?: (scrollToPostId: (postId: string) => void) => void;
  onPinnedCountChange?: (count: number) => void;
  onSnapStateChange?: (enabled: boolean) => void;
  onPositionChange?: (current: number, total: number) => void;
  courseSettings?: CourseSettings;
  themeConfig?: ThemeConfig | null;
}

export default function CourseFeed({
  courseId,
  editable = false,
  searchQuery: externalSearchQuery,
  onSearchChange,
  hideInlineSearch = false,
  onScrollToPostReady,
  onPinnedCountChange,
  onSnapStateChange,
  onPositionChange,
  courseSettings,
  themeConfig
}: CourseFeedProps) {
  const { t } = useLanguage();
  const { snapEnabled, toggleSnap } = useScrollPreferences();
  const { theme: appTheme } = useTheme();
  const [posts, setPosts] = useState<CoursePost[]>([]);

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const getHeaderBgColor = (bg: string, opacity: number): string => {
    if (bg.startsWith('rgba')) {
      return bg;
    }
    const rgb = hexToRgb(bg);
    if (rgb) {
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
    return `rgba(255, 255, 255, ${opacity})`;
  };
  const [loading, setLoading] = useState(true);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const [filteredPosts, setFilteredPosts] = useState<CoursePost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingMediaGroupPostId, setEditingMediaGroupPostId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [authToken, setAuthToken] = useState<string>('');
  const [pinnedPostIds, setPinnedPostIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    text_content: '',
    storage_path: '',
    file_name: '',
    file_size: 0,
    media_type: ''
  });
  const [newPostMediaFiles, setNewPostMediaFiles] = useState<Array<{
    storage_path: string;
    file_name: string;
    file_size: number;
    media_type: string;
  }>>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [mediaItems, setMediaItems] = useState<Array<{
    id: string;
    media_type: string;
    file_id: string;
    thumbnail_file_id?: string;
    file_name?: string;
    messageId: string;
  }>>([]);
  const [currentMediaGroup, setCurrentMediaGroup] = useState<Array<{
    id: string;
    media_type: string;
    file_id: string;
    thumbnail_file_id?: string;
    file_name?: string;
    messageId: string;
  }>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activePostIndex, setActivePostIndex] = useState(0);
  const postRefs = useRef<Map<string, HTMLElement>>(new Map());
  const feedContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPosts();
    loadAuthToken();
    if (!editable) {
      loadPinnedPosts();
    }
  }, [courseId]);

  useEffect(() => {
    if (editable) return;

    // Poll for pinned posts updates every 10 seconds
    const interval = setInterval(() => {
      loadPinnedPosts();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [courseId, editable]);

  useEffect(() => {
    if (onPinnedCountChange) {
      onPinnedCountChange(pinnedPostIds.size);
    }
  }, [pinnedPostIds, onPinnedCountChange]);

  useEffect(() => {
    if (onSnapStateChange) {
      onSnapStateChange(snapEnabled);
    }
  }, [snapEnabled, onSnapStateChange]);

  useEffect(() => {
    if (onPositionChange) {
      onPositionChange(filteredPosts.length - activePostIndex - 1, filteredPosts.length);
    }
  }, [activePostIndex, filteredPosts.length, onPositionChange]);

  const loadAuthToken = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
  };

  const loadPinnedPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      apiClient.setToken(token);

      const data = await apiClient.getPinnedPosts(courseId);
      const pinnedIds = new Set<string>((data || []).map((p: any) => p.post_id));
      setPinnedPostIds(pinnedIds);
    } catch (error) {
      console.error('Error loading pinned posts:', error);
    }
  };

  const togglePinPost = async (postId: string) => {
    const isPinned = pinnedPostIds.has(postId);
    const oldPinnedIds = new Set(pinnedPostIds);
    const newPinnedIds = new Set(pinnedPostIds);

    if (isPinned) {
      newPinnedIds.delete(postId);
    } else {
      newPinnedIds.add(postId);
    }
    setPinnedPostIds(newPinnedIds);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPinnedPostIds(oldPinnedIds);
        return;
      }
      apiClient.setToken(token);

      if (isPinned) {
        await apiClient.unpinPost(postId);
      } else {
        await apiClient.pinPost(postId);
      }

      await loadPinnedPosts();
    } catch (error) {
      console.error('[CourseFeed] Error toggling pin:', error);
      setPinnedPostIds(oldPinnedIds);
      alert(t('failedToSave'));
    }
  };

  const scrollToPost = useCallback((index: number) => {
    if (index < 0 || index >= filteredPosts.length) return;

    const postId = filteredPosts[index].id;
    const postElement = postRefs.current.get(postId);

    if (postElement) {
      requestAnimationFrame(() => {
        const headerOffset = 80;
        const elementPosition = postElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        setActivePostIndex(index);
      });
    }
  }, [filteredPosts]);

  const scrollToPostById = useCallback((postId: string) => {
    const postElement = postRefs.current.get(postId);
    if (!postElement) return;

    requestAnimationFrame(() => {
      const headerOffset = 80;
      const elementPosition = postElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    });
  }, []);

  useEffect(() => {
    if (onScrollToPostReady) {
      onScrollToPostReady(scrollToPostById);
    }
  }, [onScrollToPostReady, scrollToPostById]);

  useEffect(() => {
    const updateActiveIndexFromScroll = () => {
      if (!snapEnabled) return;

      const scrollPosition = window.scrollY + window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      postRefs.current.forEach((element, postId) => {
        const index = filteredPosts.findIndex(p => p.id === postId);
        if (index === -1) return;

        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        const distance = Math.abs(scrollPosition - elementTop);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActivePostIndex(closestIndex);
    };

    if (snapEnabled) {
      window.addEventListener('scroll', updateActiveIndexFromScroll);
      return () => window.removeEventListener('scroll', updateActiveIndexFromScroll);
    }
  }, [snapEnabled, filteredPosts]);

  const navigateToNextPost = useCallback(() => {
    if (activePostIndex < filteredPosts.length - 1) {
      scrollToPost(activePostIndex + 1);
    }
  }, [activePostIndex, filteredPosts.length, scrollToPost]);

  const navigateToPrevPost = useCallback(() => {
    if (activePostIndex > 0) {
      scrollToPost(activePostIndex - 1);
    }
  }, [activePostIndex, scrollToPost]);

  useEffect(() => {
    if (!snapEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingPostId || isCreating) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          navigateToNextPost();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          navigateToPrevPost();
          break;
        case 'Home':
          e.preventDefault();
          scrollToPost(filteredPosts.length - 1);
          break;
        case 'End':
          e.preventDefault();
          scrollToPost(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [snapEnabled, editingPostId, isCreating, navigateToNextPost, navigateToPrevPost, scrollToPost, filteredPosts.length]);

  useEffect(() => {
    if (!snapEnabled || !feedContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const postId = entry.target.getAttribute('data-post-id');
            if (postId) {
              const index = filteredPosts.findIndex(p => p.id === postId);
              if (index !== -1) {
                setActivePostIndex(index);
              }
            }
          }
        });
      },
      { threshold: 0.5, root: null }
    );

    postRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [snapEnabled, filteredPosts]);

  useEffect(() => {
    let filtered = posts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(query) ||
        post.text_content.toLowerCase().includes(query)
      );
    }

    setFilteredPosts(filtered);

    const items = filtered
      .filter(post => (post.storage_path || post.telegram_file_id) && !post.has_error && (post.media_type === 'image' || post.media_type === 'video' || post.media_type === 'photo' || post.media_type === 'animation'))
      .map(post => ({
        id: post.id,
        media_type: post.media_type === 'photo' ? 'image' : post.media_type === 'animation' ? 'video' : (post.media_type || 'image'),
        file_id: post.storage_path || post.telegram_file_id || '',
        thumbnail_file_id: post.telegram_thumbnail_file_id || undefined,
        file_name: post.file_name || undefined,
        messageId: post.id
      }));
    setMediaItems(items);
  }, [searchQuery, posts]);

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      apiClient.setToken(token);

      const postsData = await apiClient.getCoursePosts(courseId, 200, 0);

      const postsWithMedia = (postsData || []).map((post: any) => {
        if (post.media && post.media.length > 0) {
          const mediaItems = post.media.map((m: any) => ({
            id: m.id,
            post_id: post.id,
            media_type: m.media_type,
            storage_path: m.file_path || m.storage_path || null,
            telegram_file_id: m.telegram_file_id || null,
            telegram_thumbnail_file_id: m.thumbnail_path || m.telegram_thumbnail_file_id || null,
            file_name: m.file_name || null,
            file_size: m.file_size || null,
            order_index: m.display_order ?? m.order_index ?? 0,
          }));
          return { ...post, media_items: mediaItems };
        }

        if ((post.storage_path || post.telegram_file_id) && !post.media_items) {
          return {
            ...post,
            media_items: [{
              id: `legacy-${post.id}`,
              post_id: post.id,
              media_type: post.media_type,
              storage_path: post.storage_path,
              telegram_file_id: post.telegram_file_id,
              telegram_thumbnail_file_id: post.telegram_thumbnail_file_id,
              file_name: post.file_name,
              file_size: post.file_size,
              order_index: 0,
              created_at: post.created_at
            }]
          };
        }

        return post;
      });

      setPosts(postsWithMedia || []);
      setFilteredPosts(postsWithMedia || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setIsCreating(true);
    setEditingPostId(null);
    setFormData({
      title: '',
      text_content: '',
      storage_path: '',
      file_name: '',
      file_size: 0,
      media_type: ''
    });
    setNewPostMediaFiles([]);
  };

  const handleEditPost = (post: CoursePost) => {
    setEditingPostId(post.id);
    setIsCreating(false);
    setFormData({
      title: post.title || '',
      text_content: post.text_content || '',
      storage_path: post.storage_path || post.telegram_file_id || '',
      file_name: post.file_name || '',
      file_size: post.file_size || 0,
      media_type: post.media_type || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setIsCreating(false);
    setUploadingMedia(false);
    setFormData({
      title: '',
      text_content: '',
      storage_path: '',
      file_name: '',
      file_size: 0,
      media_type: ''
    });
    setNewPostMediaFiles([]);
  };

  const handleSavePost = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);

      if (editingPostId) {
        await apiClient.updatePost(editingPostId, {
          title: formData.title,
          text_content: formData.text_content,
          storage_path: formData.storage_path || null,
          file_name: formData.file_name || null,
          file_size: formData.file_size || null,
          media_type: formData.media_type || null,
          telegram_file_id: null,
          telegram_thumbnail_file_id: null,
          has_error: false,
          error_message: null,
        });
        alert(t('postUpdated'));
      } else {
        if (newPostMediaFiles.length > 1) {
          const newPost = await apiClient.createCoursePost(courseId, {
            text_content: formData.text_content,
            media: newPostMediaFiles.map((file, index) => ({
              media_type: file.media_type,
              file_path: file.storage_path,
              file_size: file.file_size,
            })),
          } as any);
          alert(t('postCreated'));
        } else {
          const singleMedia = newPostMediaFiles[0];
          await apiClient.createCoursePost(courseId, {
            text_content: formData.text_content,
            media: singleMedia ? [{
              media_type: singleMedia.media_type,
              file_path: singleMedia.storage_path,
              file_size: singleMedia.file_size,
            }] : undefined,
          } as any);
          alert(t('postCreated'));
        }
      }

      handleCancelEdit();
      loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      alert(t('failedToSave'));
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm(t('deletePostConfirm'))) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);
      await apiClient.deletePost(postId);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(t('failedToDelete'));
    }
  };

  const handleFileUploadComplete = (storagePath: string, fileSize: number, fileName: string) => {
    const ext = fileName.toLowerCase();
    let mediaType = 'file';

    if (ext.match(/\.(mp4|mov|avi|mkv|webm)$/)) mediaType = 'video';
    else if (ext.match(/\.(png|jpg|jpeg|gif|webp)$/)) mediaType = 'image';
    else if (ext.match(/\.(txt|md)$/)) mediaType = 'text';

    if (isCreating) {
      setNewPostMediaFiles(prev => [...prev, {
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize,
        media_type: mediaType
      }]);
    } else {
      setFormData(prev => ({
        ...prev,
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize,
        media_type: mediaType
      }));
    }
    setUploadingMedia(false);
  };

  const handleRemoveMediaFromNew = (index: number) => {
    setNewPostMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveMedia = () => {
    setShowDeleteConfirm(true);
  };

  const confirmRemoveMedia = () => {
    setFormData(prev => ({
      ...prev,
      storage_path: '',
      file_name: '',
      file_size: 0,
      media_type: ''
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return t('today') || 'Сегодня';
    } else if (diffDays === 2) {
      return t('yesterday') || 'Вчера';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} ${t('daysAgo') || 'дней назад'}`;
    } else {
      return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const handleMediaClick = (post: CoursePost, initialIndex: number = 0) => {
    if (post.media_items && post.media_items.length > 0) {
      const groupMediaItems = post.media_items.map(item => ({
        id: item.id,
        media_type: item.media_type || 'image',
        file_id: item.storage_path || item.telegram_file_id || '',
        thumbnail_file_id: item.telegram_thumbnail_file_id || undefined,
        file_name: item.file_name || undefined,
        messageId: post.id
      }));
      setCurrentMediaGroup(groupMediaItems);
      setSelectedMediaIndex(initialIndex);
    } else {
      setCurrentMediaGroup([]);
      const index = mediaItems.findIndex(item => item.id === post.id);
      if (index !== -1) {
        setSelectedMediaIndex(index);
      }
    }
  };

  const getSecureMediaUrl = (fileId: string): string => {
    const apiUrl = import.meta.env.VITE_API_URL || 'https://api.keykurs.ru';

    // If fileId looks like a storage path (contains /), it's S3 storage path
    if (fileId.includes('/')) {
      return apiClient.getMediaUrl(fileId);
    }

    // Otherwise, it's a telegram file ID - use backend API
    const url = `${apiUrl}/api/telegram/file/${encodeURIComponent(fileId)}?course_id=${encodeURIComponent(courseId)}`;

    if (authToken) {
      return `${url}&token=${encodeURIComponent(authToken)}`;
    }

    return url;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={feedContainerRef}
        className="flex-1 max-w-2xl space-y-4"
        style={snapEnabled ? {
          scrollSnapType: 'y proximity',
          scrollBehavior: 'smooth'
        } : undefined}
      >
        {!hideInlineSearch && (() => {
          const headerTheme = themeConfig?.header
            ? (appTheme === 'dark' ? themeConfig.header.dark : themeConfig.header.light)
            : null;

          return (
            <div
              className={`sticky top-[88px] z-40 rounded-lg border p-4 shadow-md backdrop-blur-sm transition-all duration-300 ${
                !headerTheme ? 'bg-white dark:bg-gray-800 bg-opacity-95 dark:bg-opacity-95 border-gray-200 dark:border-gray-700' : ''
              }`}
              style={headerTheme ? {
                backgroundColor: getHeaderBgColor(headerTheme.bg, headerTheme.bgOpacity),
                borderColor: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              } : {}}
            >
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    !headerTheme ? 'text-gray-400 dark:text-gray-500' : ''
                  }`}
                  style={headerTheme ? { color: headerTheme.text, opacity: 0.6 } : {}}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (onSearchChange) {
                      onSearchChange(value);
                    } else {
                      setInternalSearchQuery(value);
                    }
                  }}
                  placeholder={t('searchPosts')}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    !headerTheme ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100' : ''
                  }`}
                  style={headerTheme ? {
                    backgroundColor: appTheme === 'dark'
                      ? `rgba(${hexToRgb(headerTheme.bg)?.r || 0}, ${hexToRgb(headerTheme.bg)?.g || 0}, ${hexToRgb(headerTheme.bg)?.b || 0}, ${Math.min(headerTheme.bgOpacity + 0.15, 1)})`
                      : `rgba(${hexToRgb(headerTheme.bg)?.r || 255}, ${hexToRgb(headerTheme.bg)?.g || 255}, ${hexToRgb(headerTheme.bg)?.b || 255}, ${Math.min(headerTheme.bgOpacity + 0.1, 1)})`,
                    borderColor: appTheme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                    color: headerTheme.text
                  } : {}}
                />
              </div>
            </div>
          );
        })()}

        {filteredPosts.length === 0 && !isCreating ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? t('noResultsFound') : t('noPostsYet')}
            </p>
          </div>
        ) : (
          <div className={courseSettings?.compact_view ? 'space-y-2' : 'space-y-3'}>
            {filteredPosts.map((post, index) => (
              <article
                key={post.id}
                ref={(el) => {
                  if (el) {
                    postRefs.current.set(post.id, el);
                  } else {
                    postRefs.current.delete(post.id);
                  }
                }}
                data-post-id={post.id}
                className={`relative overflow-hidden transition-all duration-300 ${
                  post.has_error && editable
                    ? 'border-red-500 dark:border-red-600 border-2'
                    : ''
                } ${courseSettings?.compact_view ? 'text-sm' : ''}`}
                style={{
                  ...(themeConfig?.posts
                    ? getPostStyles(
                        appTheme === 'dark' ? themeConfig.posts.dark : themeConfig.posts.light,
                        themeConfig.posts.style,
                        themeConfig.posts.borderRadius,
                        appTheme === 'dark'
                      )
                    : {
                        backgroundColor: appTheme === 'dark' ? '#1f2937' : '#ffffff',
                        borderRadius: '12px',
                        border: `1px solid ${appTheme === 'dark' ? '#374151' : '#e5e7eb'}`,
                        boxShadow: appTheme === 'dark'
                          ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                          : '0 4px 12px rgba(0, 0, 0, 0.15)',
                        color: appTheme === 'dark' ? '#f9fafb' : '#1f2937'
                      }),
                  ...(snapEnabled ? {
                    scrollSnapAlign: 'start',
                    scrollMarginTop: hideInlineSearch ? '96px' : '180px'
                  } : {})
                }}
              >
                {editingMediaGroupPostId === post.id ? (
                  <div className="p-4 relative z-10">
                    <MediaGroupEditor
                      postId={post.id}
                      courseId={courseId}
                      mediaItems={post.media_items || []}
                      postTitle={post.title}
                      postContent={post.text_content}
                      onUpdate={() => {
                        setEditingMediaGroupPostId(null);
                        loadPosts();
                      }}
                      onCancel={() => setEditingMediaGroupPostId(null)}
                    />
                  </div>
                ) : (
                <div className="relative z-10">
                  {post.has_error && editable && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-b-2 border-red-200 dark:border-red-800 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                            Медиафайл не был загружен
                          </h4>
                          <p className="text-sm text-red-800 dark:text-red-200">
                            {post.error_message || 'Telegram может передавать файлы только до 20 МБ. Пожалуйста, загрузите видео или изображение вручную через форму редактирования ниже.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {post.media_items && post.media_items.length === 1 && !post.has_error && (
                    <>
                      {post.media_items[0].media_type === 'video' || post.media_items[0].media_type === 'animation' ? (
                        <div className="w-full">
                          <MediaGallery
                            items={post.media_items}
                            courseId={courseId}
                            onMediaClick={(index) => {
                              handleMediaClick(post, index);
                            }}
                            courseWatermark={courseSettings?.watermark}
                          />
                        </div>
                      ) : post.media_items[0].media_type === 'voice' || post.media_items[0].media_type === 'audio' ? (
                        <div className={courseSettings?.compact_view ? 'px-2 py-3' : 'px-4 py-4'}>
                          <VoicePlayer
                            audioUrl={getSecureMediaUrl(post.media_items[0].storage_path || post.media_items[0].telegram_file_id || '')}
                            duration={post.media_items[0].duration || undefined}
                            compact={courseSettings?.compact_view}
                          />
                        </div>
                      ) : (
                        <div className="w-full">
                          <MediaGallery
                            items={post.media_items}
                            courseId={courseId}
                            onMediaClick={(index) => {
                              handleMediaClick(post, index);
                            }}
                            courseWatermark={courseSettings?.watermark}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {post.media_items && post.media_items.length > 1 && !post.has_error && (
                    <div className="w-full">
                      <MediaGallery
                        items={post.media_items}
                        courseId={courseId}
                        onMediaClick={(index) => {
                          handleMediaClick(post, index);
                        }}
                        courseWatermark={courseSettings?.watermark}
                      />
                    </div>
                  )}

                  {!post.media_items && (post.storage_path || post.telegram_file_id) && !post.has_error && (
                    <>
                      {post.media_type === 'video' || post.media_type === 'animation' ? (
                        <div className="flex justify-center">
                          <MediaThumbnail
                            mediaType={post.media_type || 'video'}
                            fileId={post.storage_path || post.telegram_file_id || ''}
                            thumbnailFileId={post.telegram_thumbnail_file_id || undefined}
                            fileName={post.file_name || undefined}
                            width={post.telegram_media_width || undefined}
                            height={post.telegram_media_height || undefined}
                            postId={post.id}
                            courseId={courseId}
                            onClick={() => handleMediaClick(post)}
                            getSecureMediaUrl={getSecureMediaUrl}
                            courseWatermark={courseSettings?.watermark}
                          />
                        </div>
                      ) : post.media_type === 'voice' || post.media_type === 'audio' ? (
                        <div className={courseSettings?.compact_view ? 'px-2 py-3' : 'px-4 py-4'}>
                          <VoicePlayer
                            audioUrl={getSecureMediaUrl(post.storage_path || post.telegram_file_id || '')}
                            duration={undefined}
                            compact={courseSettings?.compact_view}
                          />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <MediaThumbnail
                            mediaType={post.media_type || 'image'}
                            fileId={post.storage_path || post.telegram_file_id || ''}
                            thumbnailFileId={post.telegram_thumbnail_file_id || undefined}
                            fileName={post.file_name || undefined}
                            width={post.telegram_media_width || undefined}
                            height={post.telegram_media_height || undefined}
                            postId={post.id}
                            courseId={courseId}
                            onClick={() => handleMediaClick(post)}
                            getSecureMediaUrl={getSecureMediaUrl}
                            courseWatermark={courseSettings?.watermark}
                          />
                        </div>
                      )}
                    </>
                  )}

                  <div className={courseSettings?.compact_view ? 'p-3' : 'p-4'}>
                    {post.text_content && (
                      <p className={`whitespace-pre-wrap leading-relaxed ${courseSettings?.compact_view ? 'mb-2' : 'mb-3'}`}>
                        {post.text_content}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs opacity-60">
                        {courseSettings?.show_lesson_numbers && (
                          <span className="font-semibold text-teal-600 dark:text-teal-400">
                            #{filteredPosts.length - index}
                          </span>
                        )}
                        {courseSettings?.show_post_dates && (
                          <>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(post.published_at)}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {!editable && (
                          <button
                            onClick={() => togglePinPost(post.id)}
                            className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                              pinnedPostIds.has(post.id) ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-400'
                            }`}
                            title={pinnedPostIds.has(post.id) ? t('unpinPost') : t('pinPost')}
                          >
                            <Pin className={`w-4 h-4 ${pinnedPostIds.has(post.id) ? 'fill-current' : ''}`} />
                          </button>
                        )}
                        {editable && (
                          <>
                            <button
                              onClick={() => setEditingMediaGroupPostId(post.id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
        )}

        {editable && !isCreating && (
        <div className="sticky bottom-4 z-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-lg">
          <button
            onClick={handleCreatePost}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('createPost')}
          </button>
        </div>
      )}

      {isCreating && (
        <div className="sticky bottom-4 z-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('title')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder={t('postTitle')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('content')}
              </label>
              <textarea
                value={formData.text_content}
                onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder={t('postContent')}
              />
            </div>

            <div>
              {newPostMediaFiles.length > 0 && (
                <div className="mb-3 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Uploaded Media ({newPostMediaFiles.length}/10)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {newPostMediaFiles.map((file, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                      >
                        {file.media_type === 'image' ? (
                          <img
                            src={getSecureMediaUrl(file.storage_path)}
                            alt={file.file_name}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gray-900 flex items-center justify-center">
                            <Video className="w-8 h-8 text-white opacity-80" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                          <button
                            onClick={() => handleRemoveMediaFromNew(index)}
                            className="absolute top-1 right-1 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 px-2 py-1">
                          <p className="text-white text-xs truncate">
                            {file.file_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadingMedia ? (
                <FileUpload
                  courseId={courseId}
                  lessonId=""
                  onUploadComplete={handleFileUploadComplete}
                />
              ) : newPostMediaFiles.length < 10 ? (
                <button
                  onClick={() => setUploadingMedia(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-teal-500 dark:hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-gray-600 dark:text-gray-400 text-sm transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {newPostMediaFiles.length === 0 ? t('uploadMedia') : 'Add More Media'}
                </button>
              ) : (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  Maximum of 10 media files reached
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSavePost}
                disabled={!formData.text_content.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {t('save')}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

        <MediaModal
          isOpen={selectedMediaIndex !== null}
          onClose={() => {
            setSelectedMediaIndex(null);
            setCurrentMediaGroup([]);
          }}
          mediaItems={currentMediaGroup.length > 0 ? currentMediaGroup : mediaItems}
          currentIndex={selectedMediaIndex || 0}
          onNavigate={setSelectedMediaIndex}
          getSecureMediaUrl={getSecureMediaUrl}
          courseWatermark={courseSettings?.watermark}
        />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmRemoveMedia}
          title={t('deleteMediaConfirm') || 'Удалить медиафайл?'}
          message="Это действие нельзя отменить. Медиафайл будет удален из поста."
          confirmText={t('delete') || 'Удалить'}
          cancelText={t('cancel') || 'Отмена'}
          variant="danger"
        />

        {snapEnabled && filteredPosts.length > 0 && (
          <div className="lg:hidden fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2 z-50">
            <button
              onClick={navigateToPrevPost}
              disabled={activePostIndex === 0}
              className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Previous post"
            >
              <ArrowUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="px-3 py-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg text-xs font-medium text-gray-700 dark:text-gray-300 text-center min-w-[60px]">
              {filteredPosts.length - activePostIndex}/{filteredPosts.length}
            </div>
            <button
              onClick={navigateToNextPost}
              disabled={activePostIndex === filteredPosts.length - 1}
              className="p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Next post"
            >
              <ArrowDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
