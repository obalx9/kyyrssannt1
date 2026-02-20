import { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { apiClient } from '../lib/api';

export interface MediaItem {
  id: string;
  media_type: string;
  telegram_file_id?: string | null;
  telegram_thumbnail_file_id?: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  order_index: number;
}

interface MediaGalleryProps {
  items: MediaItem[];
  courseId: string;
  onMediaClick?: (index: number) => void;
  courseWatermark?: string | null;
}

export default function MediaGallery({ items, courseId, onMediaClick, courseWatermark }: MediaGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());
  const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());
  const blobUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadImages = async () => {
      for (const item of items) {
        if (loadedImages.has(item.id) || errorImages.has(item.id) || imageUrls.has(item.id)) {
          continue;
        }

        try {
          let url: string;

          if (item.storage_path) {
            url = apiClient.getMediaUrl(item.storage_path);
          } else if (item.telegram_file_id) {
            const token = localStorage.getItem('token');
            if (!token) {
              throw new Error('No auth token');
            }
            apiClient.setToken(token);

            const fileId = (item.media_type === 'video' || item.media_type === 'animation') && item.telegram_thumbnail_file_id
              ? item.telegram_thumbnail_file_id
              : item.telegram_file_id;

            url = await apiClient.getTelegramFileUrl(fileId, courseId);
            blobUrlsRef.current.add(url);
          } else {
            continue;
          }

          setImageUrls(prev => new Map(prev).set(item.id, url));
        } catch (error) {
          console.error('Error loading image:', error);
          setErrorImages(prev => new Set([...prev, item.id]));
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
  }, [items, courseId]);

  const handleImageLoad = (id: string) => {
    setLoadedImages(prev => new Set([...prev, id]));
  };

  const handleImageError = (id: string) => {
    setErrorImages(prev => new Set([...prev, id]));
  };

  const getLayoutClass = (count: number, index: number): string => {
    if (count === 1) {
      return 'col-span-2 row-span-2';
    }

    if (count === 2) {
      return 'col-span-1 row-span-2';
    }

    if (count === 3) {
      if (index === 0) {
        return 'col-span-1 row-span-2';
      }
      return 'col-span-1 row-span-1';
    }

    if (count === 4) {
      return 'col-span-1 row-span-1';
    }

    if (count === 5) {
      if (index < 2) {
        return 'col-span-1 row-span-1';
      }
      return 'col-span-1 row-span-1';
    }

    return 'col-span-1 row-span-1';
  };

  const getContainerClass = (count: number): string => {
    if (count === 1) {
      return 'grid grid-cols-1 gap-0.5 w-full';
    }

    if (count === 2) {
      return 'grid grid-cols-2 gap-0.5 w-full h-[400px]';
    }

    if (count === 3) {
      return 'grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-[400px]';
    }

    if (count === 4) {
      return 'grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-[400px]';
    }

    if (count <= 6) {
      return 'grid grid-cols-3 grid-rows-2 gap-0.5 w-full h-[400px]';
    }

    return 'grid grid-cols-3 gap-0.5 w-full min-h-[300px]';
  };

  const formatDuration = (seconds?: number | null): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className={getContainerClass(sortedItems.length)}>
      {sortedItems.map((item, index) => {
        const mediaUrl = imageUrls.get(item.id);
        const isVideo = item.media_type === 'video' || item.media_type === 'animation';
        const isLoaded = loadedImages.has(item.id);
        const hasError = errorImages.has(item.id);
        const isSingle = sortedItems.length === 1;

        return (
          <div
            key={item.id}
            className={`relative ${getLayoutClass(sortedItems.length, index)} overflow-hidden bg-gray-900 cursor-pointer group ${
              isSingle ? 'max-h-[500px]' : ''
            }`}
            onClick={() => onMediaClick?.(index)}
          >
            {!hasError && !mediaUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-400 text-xs">
                Failed to load
              </div>
            )}

            {mediaUrl && (
              <>
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="w-8 h-8 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}

                {isSingle && !isVideo && (
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backgroundImage: `url(${mediaUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      filter: 'blur(20px)',
                      transform: 'scale(1.1)',
                      opacity: isLoaded ? 1 : 0
                    }}
                  />
                )}

                <img
                  src={mediaUrl}
                  alt={item.file_name || `Media ${index + 1}`}
                  className={`relative z-10 w-full h-full ${isSingle ? 'object-contain' : 'object-cover'}`}
                  onLoad={() => handleImageLoad(item.id)}
                  onError={() => handleImageError(item.id)}
                  style={{ opacity: isLoaded ? 1 : 0 }}
                />

                {isVideo && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-opacity">
                    <div className="bg-white bg-opacity-90 rounded-full p-4">
                      <Play className="w-8 h-8 text-gray-900" fill="currentColor" />
                    </div>
                    {item.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(item.duration)}
                      </div>
                    )}
                  </div>
                )}

                {courseWatermark && (
                  <div
                    className="absolute bottom-2 left-2 z-20 text-white text-xs font-medium px-2 py-1 rounded"
                    style={{
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                      backgroundColor: 'rgba(0,0,0,0.3)'
                    }}
                  >
                    {courseWatermark}
                  </div>
                )}

                {sortedItems.length > 1 && (
                  <div className="absolute top-2 right-2 z-20 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {index + 1}/{sortedItems.length}
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
