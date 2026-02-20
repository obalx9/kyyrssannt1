import { useRef, useEffect, useState } from 'react';
import { Loader, Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedVideoPlayerProps {
  mediaUrl: string;
  mediaType?: 'video' | 'image';
  fileName?: string;
  autoPlay?: boolean;
  lessonId?: string;
  videoUrl?: string;
  courseWatermark?: string | null;
}

export default function ProtectedVideoPlayer({
  mediaUrl,
  videoUrl,
  mediaType = 'video',
  fileName,
  autoPlay = false,
  courseWatermark = null
}: ProtectedVideoPlayerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 20, y: 20 });
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rewindAnimation, setRewindAnimation] = useState(false);
  const [forwardAnimation, setForwardAnimation] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const rawUrl = mediaUrl || videoUrl || '';

  useEffect(() => {
    if (!rawUrl) {
      setLoading(false);
      return;
    }

    const loadMediaAsBlob = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        const urlWithToken = token && rawUrl.includes('/api/')
          ? `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
          : rawUrl;

        const response = await fetch(rawUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
          throw new Error(`Failed to load media: ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } catch (err) {
        console.error('Error loading media:', err);
        setError(err instanceof Error ? err.message : 'Failed to load media');
        setBlobUrl(null);
      } finally {
        setLoading(false);
      }
    };

    loadMediaAsBlob();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [rawUrl]);

  const url = blobUrl || rawUrl;

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 5);
    setRewindAnimation(true);
    setTimeout(() => setRewindAnimation(false), 300);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(video.duration, video.currentTime + 5);
    setForwardAnimation(true);
    setTimeout(() => setForwardAnimation(false), 300);
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused) {
        await video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    } catch (err) {
      console.error('Error toggling playback:', err);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(rawUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `download-${Date.now()}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download file');
    }
  };

  useEffect(() => {
    if (videoRef.current && autoPlay && mediaType === 'video') {
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setError('Failed to play video');
      });
    }
  }, [url, autoPlay, mediaType]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target !== document.body && !(e.target as HTMLElement).closest('[data-video-player]')) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [mediaType]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const extractThumbnail = () => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        setThumbnailUrl(thumbnail);
      }
    } catch (err) {
      console.error('Error extracting thumbnail:', err);
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || mediaType !== 'video') return;
    setDuration(video.duration);
    setLoading(false);
    setError(null);

    video.currentTime = 0.1;
    video.addEventListener('seeked', extractThumbnail, { once: true });
  };

  const handleLoadedData = () => {
    setLoading(false);
    setError(null);

    if (mediaType === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.currentTime = 0.1;
      video.addEventListener('seeked', extractThumbnail, { once: true });
    }
  };

  const handleError = () => {
    setLoading(false);
    setError(mediaType === 'video' ? 'Failed to load video' : 'Failed to load image');
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    handleLoadedData();
  };

  const studentName = user?.first_name
    ? `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`
    : user?.telegram_username
    ? `@${user.telegram_username}`
    : 'Student';

  const watermarkText = courseWatermark
    ? `${courseWatermark} | ${studentName}`
    : studentName;

  if (mediaType === 'image') {
    return (
      <div className="relative w-full flex items-center justify-center bg-black overflow-hidden" style={{ minHeight: '400px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: `url(${url})`,
            filter: 'blur(40px) brightness(0.5)',
          }}
        />

        <div
          className="absolute pointer-events-none select-none z-20 transition-all duration-[4000ms] ease-in-out"
          style={{
            left: `${watermarkPosition.x}%`,
            top: `${watermarkPosition.y}%`,
            textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)',
            opacity: 0.3,
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            fontSize: '0.875rem'
          }}
        >
          <p className="text-white font-semibold tracking-wide whitespace-nowrap">
            {watermarkText}
          </p>
        </div>

        <img
          ref={imageRef}
          src={url}
          alt={fileName || 'Image'}
          className="max-w-full max-h-[85vh] w-auto h-auto object-contain relative z-10"
          onLoad={handleImageLoad}
          onError={handleError}
          onContextMenu={(e) => e.preventDefault()}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${isFullscreen ? '' : 'rounded-lg'}`}
      data-video-player
      onMouseEnter={() => mediaType === 'video' && setShowControls(true)}
      onMouseLeave={() => mediaType === 'video' && setShowControls(isPlaying ? false : true)}
      onMouseMove={() => mediaType === 'video' && setShowControls(true)}
      style={isFullscreen ? { width: '100vw', height: '100vh' } : {}}
    >
      <div className={`relative w-full bg-black overflow-hidden ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
        {thumbnailUrl && (
          <div
            className="absolute inset-0 scale-110 z-0"
            style={{
              backgroundImage: `url(${thumbnailUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.5)',
            }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <Loader className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
            <p className="text-white text-sm">{error}</p>
          </div>
        )}

        <video
          ref={videoRef}
          src={url}
          className="absolute inset-0 w-full h-full object-contain z-10"
          onLoadedMetadata={handleLoadedMetadata}
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={handleError}
          onContextMenu={(e) => e.preventDefault()}
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          onTouchStart={(e) => {
            if (e.touches.length > 1) {
              e.preventDefault();
            }
          }}
        />

        <div
          className="absolute pointer-events-none select-none z-20 transition-all duration-[4000ms] ease-in-out"
          style={{
            left: `${watermarkPosition.x}%`,
            top: `${watermarkPosition.y}%`,
            textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px rgba(0,0,0,0.7)',
            opacity: 0.3,
            transform: 'translate(-50%, -50%) rotate(-15deg)',
            fontSize: '0.875rem'
          }}
        >
          <p className="text-white font-semibold tracking-wide whitespace-nowrap">
            {watermarkText}
          </p>
        </div>

        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-300 z-30 pointer-events-none ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-6 pointer-events-auto">
            <button
              onClick={skipBackward}
              className={`w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all ${
                rewindAnimation ? 'scale-90' : 'scale-100'
              }`}
              title="Назад 5 сек"
            >
              <RotateCcw className="w-6 h-6 text-white" />
              <span className="absolute text-xs text-white font-bold mt-0.5">5</span>
            </button>

            <button
              onClick={togglePlayPause}
              className="w-16 h-16 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all"
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" fill="white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              )}
            </button>

            <button
              onClick={skipForward}
              className={`w-14 h-14 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-all ${
                forwardAnimation ? 'scale-90' : 'scale-100'
              }`}
              title="Вперёд 5 сек"
            >
              <RotateCw className="w-6 h-6 text-white" />
              <span className="absolute text-xs text-white font-bold mt-0.5">5</span>
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2 pointer-events-auto">
            <div
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer group/progress pointer-events-auto"
              onClick={handleProgressClick}
            >
              <div
                className="h-full bg-teal-500 rounded-full transition-all group-hover/progress:bg-teal-400"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  title="Mute (M)"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>

                <span className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                  title="Fullscreen (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {fileName && (
          <div className="absolute bottom-20 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none z-20">
            <p className="text-white text-sm truncate">{fileName}</p>
          </div>
        )}
      </div>
    </div>
  );
}
