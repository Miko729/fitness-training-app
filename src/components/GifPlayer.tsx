import { useEffect, useState } from "react";
import FrameAnimator from "./FrameAnimator";
import ExerciseIllustration from "./ExerciseIllustration";
import framesManifest from "../data/framesManifest.json";

interface FrameManifestEntry {
  id: string;
  zh: string;
  frames: string[];
}

interface GifPlayerProps {
  gifUrl?: string;
  exerciseId?: string;
  title: string;
  targetBodyPart?: string;
  className?: string;
  canExpand?: boolean;
}

const mediaClass =
  "w-full aspect-video object-contain rounded-xl border border-gray-700 bg-gray-800";

function isValidImageUrl(value?: string): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function GifPlayer({
  gifUrl,
  exerciseId,
  title,
  targetBodyPart = "",
  className = "",
  canExpand = true,
}: GifPlayerProps) {
  const manifest = framesManifest as FrameManifestEntry[];
  const frameEntry = manifest.find(
    (entry) =>
      (exerciseId && entry.id === exerciseId) ||
      (!exerciseId && entry.zh === title),
  );
  const hasFrames = Boolean(frameEntry?.frames.length);
  const hasGif = isValidImageUrl(gifUrl);
  const [failedFrames, setFailedFrames] = useState(false);
  const [failedGif, setFailedGif] = useState(false);
  const [loadedGif, setLoadedGif] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setFailedFrames(false);
    setFailedGif(false);
    setLoadedGif(false);
    setIsExpanded(false);
  }, [gifUrl, exerciseId, title, targetBodyPart]);

  const showFrames = hasFrames && !failedFrames;
  const showGif = !showFrames && hasGif && !failedGif;
  const illustration = (
    <ExerciseIllustration muscleKey={targetBodyPart} />
  );

  const renderMedia = () => {
    if (showFrames && frameEntry) {
      return (
        <FrameAnimator
          frames={frameEntry.frames}
          fallback={illustration}
          onError={() => setFailedFrames(true)}
        />
      );
    }

    if (showGif && gifUrl) {
      return (
        <>
          {!loadedGif && illustration}
          <img
            src={gifUrl}
            alt={`${title}，${targetBodyPart}`}
            loading="lazy"
            onLoad={() => setLoadedGif(true)}
            onError={() => {
              setFailedGif(true);
              setLoadedGif(false);
            }}
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ${
              loadedGif ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      );
    }

    return illustration;
  };

  const visual = (
    <div
      role="img"
      aria-label={`${title}，${targetBodyPart}`}
      className={`relative overflow-hidden ${mediaClass}`}
    >
      {renderMedia()}
    </div>
  );

  return (
    <>
      <div className={`w-full ${className}`}>
        {canExpand ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded(true);
            }}
            aria-label={`放大查看${title}`}
            className="block w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            {visual}
          </button>
        ) : (
          visual
        )}
      </div>

      {isExpanded && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsExpanded(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`${title}动作示范`}
            className="relative w-full max-w-3xl rounded-2xl border border-gray-700 bg-gray-900 p-3 sm:p-5"
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="关闭图片"
              className="mb-2 ml-auto flex min-h-12 min-w-12 items-center justify-center rounded-xl text-2xl text-gray-300 hover:bg-gray-800"
            >
              ×
            </button>
            <div className="relative w-full overflow-hidden">
              {renderMedia()}
            </div>
            <p className="mt-3 text-center font-medium text-white">{title}</p>
            <p className="text-center text-sm text-gray-400">
              {targetBodyPart}
            </p>
          </section>
        </div>
      )}
    </>
  );
}
