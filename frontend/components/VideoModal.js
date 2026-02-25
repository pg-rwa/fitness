"use client";
import { useEffect, useRef, useCallback } from "react";

function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getYouTubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise proper form")}`;
}

export default function VideoModal({ exercise, onClose }) {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  const youtubeId = exercise ? extractYouTubeId(exercise.video_url) : null;
  const searchQuery = exercise ? exercise.name + " exercise proper form" : "";

  const initPlayer = useCallback(() => {
    if (!containerRef.current || !window.YT?.Player) return;
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "100%",
      width: "100%",
      playerVars: { rel: 0, modestbranding: 1, origin: window.location.origin },
      events: {
        onReady: (event) => {
          if (youtubeId) {
            event.target.cueVideoById(youtubeId);
          } else {
            event.target.cuePlaylist({ listType: "search", list: searchQuery });
          }
        },
      },
    });
  }, [youtubeId, searchQuery]);

  useEffect(() => {
    if (!exercise) return;

    // Load YouTube IFrame API if not already loaded
    if (window.YT?.Player) {
      initPlayer();
    } else {
      const existingScript = document.getElementById("yt-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [exercise, initPlayer]);

  if (!exercise) return null;

  const fallbackUrl = getYouTubeSearchUrl(exercise.name);

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h3 className="text-white font-bold text-sm">{exercise.name}</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              {exercise.muscle_group} {exercise.equipment ? `· ${exercise.equipment}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* YouTube Player */}
        <div className="bg-black">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <div ref={containerRef} className="absolute inset-0" />
          </div>
        </div>

        {/* Fallback link + instructions */}
        <div className="p-4 border-t border-gray-800">
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-400 hover:text-brand-300 text-xs inline-flex items-center gap-1 mb-3"
          >
            Open on YouTube
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {exercise.instructions && (
            <div>
              <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Instructions</h4>
              <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed max-h-40 overflow-y-auto">
                {exercise.instructions}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
