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
}

export default function MediaModal({
  isOpen,
  onClose,
  mediaItems,
  currentIndex,
  onNavigate,
  getSecureMediaUrl,
  courseWatermark = null,
}: MediaModalProps) {
  const currentMedia = mediaItems[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < mediaItems.length - 1;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePrevious = useCallback(() => {
    if (hasPrevious) {
      onNavigate(currentIndex - 1);
    }
  }, [hasPrevious, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onNavigate(currentIndex + 1);
    }
  }, [hasNext, currentIndex, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const preloadMedia = (index: number) => {
      if (index >= 0 && index < mediaItems.length) {
        const media = mediaItems[index];
        const url = getSecureMediaUrl(media.file_id);
        mediaCache.preload(media.file_id, url);
      }
    };

    preloadMedia(currentIndex - 1);
    preloadMedia(currentIndex + 1);
  }, [isOpen, currentIndex, mediaItems, getSecureMediaUrl]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaY > 100 && absDeltaY > absDeltaX * 1.5) {
      onClose();
    } else if (absDeltaX > 60 && absDeltaX > absDeltaY * 1.5) {
      if (deltaX > 0) {
        handlePrevious();
      } else {
        handleNext();
      }
    }

    touchStartRef.current = null;
  }, [onClose, handlePrevious, handleNext]);

  if (!isOpen || !currentMedia) return null;

  const mediaUrl = getSecureMediaUrl(currentMedia.file_id);
  const isVideo = currentMedia.media_type === 'video' || currentMedia.media_type === 'animation';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: `url(${mediaUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(60px) brightness(0.4)',
        }}
      />

      <div className="absolute inset-0 bg-black/60" />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 min-w-[48px] min-h-[48px] bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition-all touch-manipulation"
        aria-label="Close"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Desktop nav arrows */}
      {hasPrevious && (
        <button
          onClick={handlePrevious}
          className="hidden md:block absolute left-4 z-50 p-3 bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition-all"
          aria-label="Previous"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          className="hidden md:block absolute right-4 z-50 p-3 bg-gray-900 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition-all"
          aria-label="Next"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Mobile bottom nav */}
      {mediaItems.length > 1 && (
        <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm rounded-full px-4 py-2">
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className="p-2 text-white disabled:opacity-30 transition-opacity touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm font-medium min-w-[40px] text-center">
            {currentIndex + 1} / {mediaItems.length}
          </span>
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-2 text-white disabled:opacity-30 transition-opacity touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8 z-10">
        <div className="max-w-7xl max-h-full w-full">
          {isVideo ? (
            <ProtectedVideoPlayer
              mediaUrl={mediaUrl}
              mediaType="video"
              lessonId={currentMedia.messageId}
              courseWatermark={courseWatermark}
              fileName={currentMedia.file_name}
            />
          ) : (
            <ProtectedVideoPlayer
              mediaUrl={mediaUrl}
              mediaType="image"
              lessonId={currentMedia.messageId}
              courseWatermark={courseWatermark}
              fileName={currentMedia.file_name}
            />
          )}

          {mediaItems.length > 1 && (
            <div className="hidden md:block text-center mt-4 text-white text-sm">
              {currentIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
