import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface FrameAnimatorProps {
  frames: string[];
  interval?: number;
  fallback?: ReactNode;
  onError?: () => void;
}

export default function FrameAnimator({
  frames,
  interval = 500,
  fallback,
  onError,
}: FrameAnimatorProps) {
  const [activeFrame, setActiveFrame] = useState(0);
  const [failedFrames, setFailedFrames] = useState<Set<string>>(
    () => new Set(),
  );
  const [loadedFrames, setLoadedFrames] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    setActiveFrame(0);
    setFailedFrames(new Set());
    setLoadedFrames(new Set());
    if (frames.length < 2) return;

    const timer = window.setInterval(() => {
      setActiveFrame((current) => (current + 1) % frames.length);
    }, Math.max(50, interval));

    return () => window.clearInterval(timer);
  }, [frames, interval]);

  const hasFailedFrame = frames.some((frame) => failedFrames.has(frame));
  if (frames.length === 0 || hasFailedFrame) {
    if (fallback) return <>{fallback}</>;
    return (
      <div
        role="img"
        aria-label="动作示范图片暂不可用"
        className="flex w-full aspect-video items-center justify-center rounded-xl border border-gray-700 bg-gray-800 text-center text-sm text-gray-400"
      >
        🏋️ 动作示范图片暂不可用
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loadedFrames.has(frames[activeFrame]) && fallback}
      {frames.map((frame, index) => (
        <img
          key={frame}
          src={frame}
          alt={`动作示范第 ${index + 1} 帧`}
          loading="lazy"
          onLoad={() =>
            setLoadedFrames((current) => new Set(current).add(frame))
          }
          onError={() => {
            setFailedFrames((current) => new Set(current).add(frame));
            onError?.();
          }}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
            index === activeFrame && loadedFrames.has(frame)
              ? "opacity-100"
              : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
