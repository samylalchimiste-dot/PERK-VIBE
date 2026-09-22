import React, { useState, useEffect } from 'react';
import { resolveMediaUrl, isFirestoreMediaUri } from '../../services/firebase/mediaStore';
import { Loader2 } from 'lucide-react';

interface FirestoreVideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  videoUrl: string;
  className?: string;
  poster?: string;
}

export const FirestoreVideoPlayer: React.FC<FirestoreVideoPlayerProps> = ({
  videoUrl,
  className = '',
  poster,
  ...props
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

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
        console.error('Failed to resolve firestore video:', err);
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [videoUrl]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-black/90 text-emerald-400 gap-2 ${className}`}>
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-[11px] font-mono text-zinc-400">Chargement de la vidéo Firestore...</span>
      </div>
    );
  }

  if (hasError || !resolvedSrc) {
    return (
      <div className={`flex items-center justify-center bg-zinc-950 text-zinc-500 text-xs font-mono p-4 ${className}`}>
        <span>Vidéo non disponible</span>
      </div>
    );
  }

  return (
    <video
      src={resolvedSrc}
      poster={poster}
      className={className}
      {...props}
    />
  );
};
