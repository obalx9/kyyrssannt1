import { useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import ProtectedVideoPlayer from './ProtectedVideoPlayer';
import { mediaCache } from '../utils/mediaCache';

interface MediaItem {
  id: string;
  media_type: string;
  file_id: string;
  file_name?: string;
  messageId: string;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  getSecureMediaUrl: (fileId: string) => string;
  courseWatermark?: string | null;
  autoPlay?: boolean; // добавлено!
}

export default function MediaModal({
  isOpen,
  onClose,
  mediaItems,
  currentIndex,
  onNavigate,
  getSecureMediaUrl,
  courseWatermark = null,
  autoPlay = false, // добавлено!
}: MediaModalProps) {
  const currentMedia = mediaItems[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < mediaItems.length - 1;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // ...весь оставшийся код без изменений...

  if (!isOpen || !currentMedia) return null;

  const mediaUrl = getSecureMediaUrl(currentMedia.file_id);
  const isVideo = currentMedia.media_type === 'video' || currentMedia.media_type === 'animation';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ...фон, стрелки... */}
      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8 z-10">
        <div className="max-w-7xl max-h-full w-full">
          {isVideo ? (
            <ProtectedVideoPlayer
              mediaUrl={mediaUrl}
              mediaType="video"
              lessonId={currentMedia.messageId}
              courseWatermark={courseWatermark}
              fileName={currentMedia.file_name}
              autoPlay={autoPlay} // передаём сюда
            />
          ) : (
            <ProtectedVideoPlayer
              mediaUrl={mediaUrl}
              mediaType="image"
              lessonId={currentMedia.messageId}
              courseWatermark={courseWatermark}
              fileName={currentMedia.file_name}
              autoPlay={false}
            />
          )}
          {/* ...номер слайда... */}
        </div>
      </div>
    </div>
  );
}
