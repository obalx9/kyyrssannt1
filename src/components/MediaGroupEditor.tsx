import { useState, useEffect, useRef } from 'react';
import { Trash2, Upload, GripVertical, X, Save, Video } from 'lucide-react';
import FileUpload from './FileUpload';
import type { MediaItem } from './MediaGallery';
import { apiClient } from '../lib/api';

interface MediaGroupEditorProps {
  postId: string;
  courseId: string;
  mediaItems: MediaItem[];
  postTitle?: string;
  postContent?: string;
  onUpdate: () => void;
  onCancel: () => void;
}

export default function MediaGroupEditor({
  postId,
  courseId,
  mediaItems: initialMediaItems,
  postTitle = '',
  postContent = '',
  onUpdate,
  onCancel
}: MediaGroupEditorProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const [title, setTitle] = useState(postTitle);
  const [textContent, setTextContent] = useState(postContent);
  const [saving, setSaving] = useState(false);
  const [migrated, setMigrated] = useState(false);

  const migrateLegacyMedia = async () => {
    const legacyItems = mediaItems.filter(item => item.id.startsWith('legacy-'));
    if (legacyItems.length === 0) return;

    console.log('[MediaGroupEditor] Migrating legacy media:', legacyItems);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[MediaGroupEditor] No auth token for migration');
        return;
      }
      apiClient.setToken(token);

      const migratedItems: any[] = [];

      for (const item of legacyItems) {
        console.log('[MediaGroupEditor] Migrating item:', item);

        const newMedia = await apiClient.addPostMedia(postId, {
          media_type: item.media_type,
          storage_path: item.storage_path || null,
          telegram_file_id: item.telegram_file_id || null,
          file_name: item.file_name || null,
          file_size: (item as any).file_size || null,
          order_index: item.order_index,
        });

        console.log('[MediaGroupEditor] Migrated successfully:', newMedia);
        migratedItems.push({ old: item.id, new: newMedia });
      }

      setMediaItems(prev => prev.map(m => {
        const migrated = migratedItems.find(mi => mi.old === m.id);
        return migrated ? migrated.new : m;
      }));

      await apiClient.updatePost(postId, {
        storage_path: null,
        file_name: null,
        file_size: null,
        media_count: legacyItems.length,
      });

      setMigrated(true);
      console.log('[MediaGroupEditor] Migration completed');
    } catch (error) {
      console.error('[MediaGroupEditor] Error migrating legacy media:', error);
      throw error;
    }
  };

  const handleAddMedia = async (storagePath: string, fileSize: number, fileName: string) => {
    try {
      console.log('[MediaGroupEditor] Adding media:', { storagePath, fileSize, fileName });
      console.log('[MediaGroupEditor] Current media items:', mediaItems);

      if (!migrated && mediaItems.some(item => item.id.startsWith('legacy-'))) {
        console.log('[MediaGroupEditor] Migrating legacy media first...');
        await migrateLegacyMedia();
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No auth token');
      }

      let mediaType = 'image';
      if (fileName.match(/\.(mp4|webm|mov|avi|mkv)$/i)) {
        mediaType = 'video';
      } else if (fileName.match(/\.gif$/i)) {
        mediaType = 'animation';
      }

      apiClient.setToken(token);

      const newMedia = await apiClient.addPostMedia(postId, {
        media_type: mediaType,
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize,
        order_index: mediaItems.length,
      });

      console.log('[MediaGroupEditor] Media added successfully:', newMedia);
      setMediaItems([...mediaItems, newMedia]);
      await updatePostMediaCount(mediaItems.length + 1);

      await apiClient.updatePost(postId, { has_error: false, error_message: null });
    } catch (error) {
      console.error('[MediaGroupEditor] Error adding media:', error);
      alert('Failed to add media. Please try again.');
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media item?')) return;

    try {
      console.log('[MediaGroupEditor] Deleting media:', mediaId);

      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);

      if (mediaId.startsWith('legacy-')) {
        console.log('[MediaGroupEditor] Deleting legacy media from course_posts');
        await apiClient.updatePost(postId, {
          storage_path: null,
          file_name: null,
          file_size: null,
          media_type: null,
          media_count: 0,
        });

        const updatedItems = mediaItems.filter(item => item.id !== mediaId);
        setMediaItems(updatedItems);
        console.log('[MediaGroupEditor] Legacy media deleted successfully');
        return;
      }

      console.log('[MediaGroupEditor] Deleting media from course_post_media');
      await apiClient.deletePostMedia(postId, mediaId);

      const updatedItems = mediaItems.filter(item => item.id !== mediaId);
      setMediaItems(updatedItems);
      await updatePostMediaCount(updatedItems.length);
      await reorderMediaItems(updatedItems);
      console.log('[MediaGroupEditor] Media deleted successfully');
    } catch (error) {
      console.error('[MediaGroupEditor] Error deleting media:', error);
      alert('Failed to delete media. Please try again.');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...mediaItems];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setMediaItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);

    if (!migrated && mediaItems.some(item => item.id.startsWith('legacy-'))) {
      await migrateLegacyMedia();
    }

    await reorderMediaItems(mediaItems);
  };

  const reorderMediaItems = async (items: MediaItem[]) => {
    try {
      console.log('[MediaGroupEditor] Reordering media items');
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);

      await Promise.all(
        items.map((item, index) => apiClient.updatePostMedia(postId, item.id, { order_index: index }))
      );

      console.log('[MediaGroupEditor] Media items reordered successfully');
    } catch (error) {
      console.error('[MediaGroupEditor] Error reordering media:', error);
      alert('Failed to reorder media. Please try again.');
    }
  };

  const updatePostMediaCount = async (count: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);
      await apiClient.updatePost(postId, { media_count: count });
    } catch (error) {
      console.error('Error updating media count:', error);
    }
  };

  const handleSavePost = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error('No auth token');
      apiClient.setToken(token);

      await apiClient.updatePost(postId, {
        title,
        text_content: textContent,
        has_error: false,
        error_message: null,
      });

      onUpdate();
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadImages = async () => {
      for (const item of mediaItems) {
        if (imageUrls.has(item.id)) {
          continue;
        }

        try {
          let url: string;

          if (item.storage_path) {
            url = apiClient.getMediaUrl(item.storage_path);
          } else if (item.telegram_file_id) {
            const token = localStorage.getItem('auth_token');
            if (!token) throw new Error('No auth token');
            apiClient.setToken(token);
            url = await apiClient.getTelegramFileUrl(item.telegram_file_id, courseId);
            blobUrlsRef.current.add(url);
          } else {
            continue;
          }

          setImageUrls(prev => new Map(prev).set(item.id, url));
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }
    };

    loadImages();

    return () => {
      blobUrlsRef.current.forEach(url => {
        URL.revokeObjectURL(url);
      });
      blobUrlsRef.current.clear();
    };
  }, [mediaItems, courseId]);

  if (mediaItems.length >= 10) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Edit Post</h3>
          <button onClick={onCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              placeholder="Post content"
            />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-4 mb-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Maximum of 10 media items reached. Delete an item to add more.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mediaItems.map((item, index) => (
            <div
              key={item.id}
              className="relative group"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {imageUrls.get(item.id) ? (
                <div className="relative w-full h-32">
                  <img
                    src={imageUrls.get(item.id)}
                    alt={item.file_name || `Media ${index + 1}`}
                    className="w-full h-full object-cover rounded cursor-move"
                  />
                  {item.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-black bg-opacity-60 rounded-full p-3">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
              <button
                onClick={() => handleDeleteMedia(item.id)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSavePost}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-teal-500 rounded hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Edit Post</h3>
        <button onClick={onCancel} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Post title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            placeholder="Post content"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Media Files
        </label>
        <FileUpload
          courseId={courseId}
          onUploadComplete={handleAddMedia}
        />
        {mediaItems.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {mediaItems.length} / 10 media items
          </p>
        )}
      </div>

      {mediaItems.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                className={`relative group ${draggedIndex === index ? 'opacity-50' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
              >
                {imageUrls.get(item.id) ? (
                  <div className="relative w-full h-32">
                    <img
                      src={imageUrls.get(item.id)}
                      alt={item.file_name || `Media ${index + 1}`}
                      className="w-full h-full object-cover rounded cursor-move"
                    />
                    {item.media_type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black bg-opacity-60 rounded-full p-3">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
                <button
                  onClick={() => handleDeleteMedia(item.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                  <GripVertical className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop to reorder media items
          </p>
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePost}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-white bg-teal-500 rounded hover:bg-teal-600 disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
