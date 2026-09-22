import React, { useState, useEffect, useRef } from 'react';
import { resolveMediaUrl, isFirestoreMediaUri } from '../../services/firebase/mediaStore';
import { Loader2, Play, Pause, RotateCcw, Volume2, VolumeX, Maximize } from 'lucide-react';
import { hapticFeedback } from '../../services/telegram/telegramService';
import { playClickSound } from '../../services/audio/soundService';

interface VideoPlayerOverlayProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  videoUrl: string;
  poster?: string;
  className?: string;
  onSwitchToPhotos?: () => void;
  hasPhotos?: boolean;
}

export const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({
  videoUrl,
  poster,
  className = '',
  onSwitchToPhotos,
  hasPhotos = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Default muted so autoplay is guaranteed
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(true);
  const hideControlsTimer = useRef<any>(null);

  // Resolve Firestore media if needed
  useEffect(() => {
    let isMounted = true;
    if (!videoUrl) {
      setResolvedSrc('');
      setIsLoading(false);
      return;
    }

    if (!isFirestoreMediaUri(videoUrl)) {
      setResolvedSrc(videoUrl);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    resolveMediaUrl(videoUrl)
      .then((url) => {
        if (isMounted) {
          if (url) {
            setResolvedSrc(url);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to resolve video url:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [videoUrl]);

  // Handle Autoplay once src is ready
  useEffect(() => {
    if (resolvedSrc && videoRef.current) {
      const v = videoRef.current;
      v.muted = isMuted;
      v.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If unmuted autoplay is blocked by browser/Telegram, mute and try again
          v.muted = true;
          setIsMuted(true);
          v.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        });
    }
  }, [resolvedSrc]);

  // Controls auto-hide after 3.5s of inactivity
  const resetControlsTimer = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    hapticFeedback('light');
    playClickSound();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      resetControlsTimer();
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    if (!videoRef.current) return;
    const next = !videoRef.current.muted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const seekRelative = (seconds: number, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('light');
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    resetControlsTimer();
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticFeedback('medium');
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {
        // Fallback for iOS Safari WebKit
        if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      });
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - currentTime;

  if (isLoading) {
    return (
      <div className={`relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#07090e] border border-cyan-500/20 flex flex-col items-center justify-center p-6 text-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <span className="text-xs font-mono text-cyan-200">Chargement de la vidéo officielle...</span>
      </div>
    );
  }

  if (hasError || !resolvedSrc) {
    return (
      <div className={`relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#07090e] border border-zinc-800 flex flex-col items-center justify-center p-6 text-center text-zinc-400 ${className}`}>
        <p className="text-xs mb-3">La vidéo n'a pas pu être chargée.</p>
        {hasPhotos && onSwitchToPhotos && (
          <button
            onClick={onSwitchToPhotos}
            className="px-4 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-medium"
          >
            Voir la photo
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={() => {
        setShowControls((prev) => !prev);
        if (!showControls) resetControlsTimer();
      }}
      className={`relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-black border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] select-none group ${className}`}
    >
      {/* Underlying Video Element */}
      <video
        ref={videoRef}
        src={resolvedSrc}
        poster={poster}
        playsInline
        autoPlay
        muted={isMuted}
        loop
        onTimeUpdate={() => {
          if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-cover object-center"
      />

      {/* Top Overlay Badge & Header actions (Matching Screenshot 2) */}
      <div className={`absolute top-0 inset-x-0 p-3.5 flex items-center justify-between z-20 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Left: "▶ Vidéo" cyan pill matching Screenshot 2 */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#091522]/90 border border-cyan-400/40 text-cyan-300 text-[11px] font-semibold backdrop-blur-md shadow-md">
            <span className="text-[10px] text-cyan-400">▶</span>
            <span>Vidéo</span>
          </div>

          {/* Optional Switch to photo button if photos exist */}
          {hasPhotos && onSwitchToPhotos && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                hapticFeedback('light');
                onSwitchToPhotos();
              }}
              className="px-2.5 py-1 rounded-xl bg-black/60 hover:bg-black/80 border border-zinc-700/60 text-zinc-300 hover:text-white text-[10px] font-mono backdrop-blur-md transition"
            >
              Photo
            </button>
          )}
        </div>

        {/* Right Top Controls: Mute & Expand */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-zinc-700/60 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
            title={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 border border-zinc-700/60 flex items-center justify-center text-white backdrop-blur-md transition active:scale-95"
            title="Plein écran"
          >
            <Maximize className="w-4 h-4 text-zinc-200" />
          </button>
        </div>
      </div>

      {/* Center Large Controls: [ -10s ]  [ ▶ / ⏸ ]  [ +10s ] matching Screenshot 2 */}
      <div className={`absolute inset-0 flex items-center justify-center gap-6 z-20 pointer-events-none transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Rewind -10s circle */}
        <button
          onClick={(e) => seekRelative(-10, e)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/75 border border-zinc-600/60 text-white backdrop-blur-md flex flex-col items-center justify-center transition active:scale-90"
          title="-10 secondes"
        >
          <RotateCcw className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] font-bold leading-none">10</span>
        </button>

        {/* Big Center Play / Pause button */}
        <button
          onClick={togglePlay}
          className="pointer-events-auto w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 border border-white/40 text-white backdrop-blur-md flex items-center justify-center transition active:scale-90 shadow-2xl"
          title={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 fill-current text-white" />
          ) : (
            <Play className="w-8 h-8 fill-current text-white translate-x-0.5" />
          )}
        </button>

        {/* Forward +10s circle */}
        <button
          onClick={(e) => seekRelative(10, e)}
          className="pointer-events-auto w-12 h-12 rounded-full bg-black/50 hover:bg-black/75 border border-zinc-600/60 text-white backdrop-blur-md flex flex-col items-center justify-center transition active:scale-90"
          title="+10 secondes"
        >
          <RotateCcw className="w-4 h-4 mb-0.5 -scale-x-100" />
          <span className="text-[10px] font-bold leading-none">10</span>
        </button>
      </div>

      {/* Bottom Timeline & Duration Controls matching Screenshot 2 */}
      <div className={`absolute bottom-0 inset-x-0 p-3.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Progress Bar */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!videoRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * duration;
          }}
          className="w-full h-1.5 bg-white/20 hover:h-2.5 rounded-full cursor-pointer overflow-hidden transition-all mb-2 relative"
        >
          <div
            className="h-full bg-cyan-400 rounded-full"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Timers: current and remaining (e.g. 00:16   -00:03) */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-300">
          <span>{formatTime(currentTime)}</span>
          <span>-{formatTime(remainingTime > 0 ? remainingTime : 0)}</span>
        </div>
      </div>
    </div>
  );
};
