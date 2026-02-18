import { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { mediaCache } from '../utils/mediaCache';

interface MediaThumbnailProps {
  mediaType: string;
  fileId: string;
  thumbnailFileId?: string;
  fileName?: string;
  width?: number;
  height?: number;
  postId?: string;
  courseId?: string;
  onClick: () => void;
  getSecureMediaUrl: (fileId: string) => string;
  courseWatermark?: string | null;
}

export default function MediaThumbnail({
  mediaType,
  fileId,
  thumbnailFileId,
  fileName,
  width,
  height,
  onClick,
  getSecureMediaUrl,
  courseWatermark = null,
}: MediaThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // For videos/animations without thumbnail_file_id, skip loading
        if ((mediaType === 'video' || mediaType === 'animation') && !thumbnailFileId) {
          setLoading(false);
          return;
        }

        // For videos/animations with thumbnail_file_id, use the thumbnail
        // For photos, use the actual file
        const fileIdToLoad = ((mediaType === 'video' || mediaType === 'animation') && thumbnailFileId) ? thumbnailFileId : fileId;
        const mediaUrl = getSecureMediaUrl(fileIdToLoad);

        // Load thumbnail from cache
        const url = await mediaCache.getMedia(fileIdToLoad, mediaUrl);
        setThumbnailUrl(url);
      } catch (err) {
        console.error('Error loading thumbnail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchThumbnail();
  }, [fileId, thumbnailFileId, getSecureMediaUrl, mediaType]);

  const actualWidth = imageDimensions?.width ?? width;
  const actualHeight = imageDimensions?.height ?? height;
  const aspectRatio = actualWidth && actualHeight ? actualWidth / actualHeight : 16 / 9;
  const maxWidth = 600;
  const thumbnailHeight = maxWidth / aspectRatio;
  const isVertical = actualHeight && actualWidth ? actualHeight > actualWidth : false;
  const isSquare = actualHeight && actualWidth ? Math.abs(actualHeight - actualWidth) / actualWidth < 0.1 : false;

  if (loading) {
    return (
      <div
        className="bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer"
        style={{ width: maxWidth, height: Math.min(thumbnailHeight, 400) }}
      >
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !thumbnailUrl) {
    return (
      <div
        className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:from-gray-600 hover:to-gray-800 transition-all group"
        style={{ width: maxWidth, height: Math.min(thumbnailHeight, 400) }}
        onClick={onClick}
      >
        {mediaType === 'video' || mediaType === 'animation' ? (
          <>
            <VideoIcon className="w-16 h-16 text-gray-300 mb-4" />
            <div className="w-16 h-16 bg-white bg-opacity-90 group-hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
            {fileName && (
              <p className="text-white text-sm mt-4 px-4 text-center truncate max-w-full">
                {fileName}
              </p>
            )}
          </>
        ) : (
          <ImageIcon className="w-12 h-12 text-gray-400" />
        )}
      </div>
    );
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
  };

  return (
    <div className="w-full max-w-2xl">
      {(isVertical || isSquare) && (mediaType === 'photo' || mediaType === 'image') ? (
        <div
          className="relative rounded-lg overflow-hidden cursor-pointer group isolate"
          style={{ maxHeight: '500px' }}
          onClick={onClick}
        >
          {/* Размытый фон */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-110 z-0"
            style={{
              backgroundImage: `url(${thumbnailUrl})`,
              filter: 'blur(20px) brightness(0.8)',
            }}
          />

          {/* Основное изображение */}
          <div className="relative flex items-center justify-center z-10" style={{ minHeight: '300px', maxHeight: '500px' }}>
            <img
              src={thumbnailUrl}
              alt={fileName || 'Media'}
              className={isSquare ? "w-full h-auto object-contain" : "max-h-[500px] w-auto object-contain"}
              onContextMenu={(e) => e.preventDefault()}
              onLoad={handleImageLoad}
              draggable={false}
            />
          </div>

          {/* Оверлей при наведении */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center z-20">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageIcon className="w-12 h-12 text-white" />
            </div>
          </div>

          {courseWatermark && (
            <div
              className="absolute bottom-2 left-2 z-30 text-white text-xs font-medium px-2 py-1 rounded"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}
            >
              {courseWatermark}
            </div>
          )}
        </div>
      ) : (
        <div
          className="relative rounded-lg overflow-hidden cursor-pointer group transition-transform duration-300 hover:scale-[1.02]"
          onClick={onClick}
        >
          <img
            src={thumbnailUrl}
            alt={fileName || 'Media'}
            className="w-full h-auto object-contain"
            onContextMenu={(e) => e.preventDefault()}
            onLoad={handleImageLoad}
            draggable={false}
          />

          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            {(mediaType === 'video' || mediaType === 'animation') && (
              <div className="w-16 h-16 bg-white bg-opacity-90 group-hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all">
                <Play className="w-8 h-8 text-gray-900 ml-1" />
              </div>
            )}
            {(mediaType === 'photo' || mediaType === 'image') && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ImageIcon className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

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
        </div>
      )}
      {(mediaType === 'video' || mediaType === 'animation') && fileName && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 px-1 truncate">
          {fileName}
        </p>
      )}
    </div>
  );
}
