import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Gauge } from 'lucide-react';

interface VoicePlayerProps {
  audioUrl: string;
  duration?: number;
  compact?: boolean;
}

const PLAYBACK_RATES = [1, 1.5, 2];

export default function VoicePlayer({ audioUrl, duration, compact = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setTotalDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * totalDuration;
  };

  const cyclePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    const newRate = PLAYBACK_RATES[nextIndex];

    setPlaybackRate(newRate);
    audio.playbackRate = newRate;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="w-full">
      <div className={`mb-2 flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        <span>Голосовое сообщение</span>
      </div>

      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-2xl ${compact ? 'p-3' : 'p-4'} shadow-sm border border-teal-100 dark:border-teal-800/30 flex-1`}>
          <audio ref={audioRef} src={audioUrl} preload="metadata" />

          <button
            onClick={togglePlayPause}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative h-2 bg-teal-200 dark:bg-teal-900/40 rounded-full cursor-pointer group overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-gray-200 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs font-medium text-teal-700 dark:text-teal-300">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-teal-600/70 dark:text-teal-400/70">
                {formatTime(totalDuration)}
              </span>
            </div>
          </div>

          {isPlaying && (
            <div className="flex-shrink-0 flex items-center gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-teal-500 dark:bg-teal-400 rounded-full animate-pulse"
                  style={{
                    height: '12px',
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: '0.8s'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={cyclePlaybackRate}
          className={`flex-shrink-0 ${compact ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-teal-200 dark:border-teal-800 flex flex-col items-center justify-center transition-all shadow-sm hover:shadow-md active:scale-95 group`}
          title="Изменить скорость воспроизведения"
        >
          <Gauge className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-teal-600 dark:text-teal-400 mb-0.5`} />
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-teal-700 dark:text-teal-300`}>
            {playbackRate}x
          </span>
        </button>
      </div>
    </div>
  );
}
