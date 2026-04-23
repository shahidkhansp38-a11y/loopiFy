import { useEffect, useRef } from 'react';

interface Props {
  url: string;
  onProgress?: (percent: number, seconds: number) => void;
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export function VideoEmbed({ url, onProgress }: Props) {
  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !onProgress) return;
    const handler = () => {
      if (v.duration > 0) {
        const pct = Math.min(100, Math.round((v.currentTime / v.duration) * 100));
        onProgress(pct, Math.round(v.currentTime));
      }
    };
    v.addEventListener('timeupdate', handler);
    return () => v.removeEventListener('timeupdate', handler);
  }, [onProgress]);

  if (ytId) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black loopify-card-shadow">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
          title="Lecture video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black loopify-card-shadow">
        <iframe
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Lecture video"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    );
  }

  // Fallback: native video element
  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black loopify-card-shadow">
      <video
        ref={videoRef}
        src={url}
        controls
        controlsList="nodownload"
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
