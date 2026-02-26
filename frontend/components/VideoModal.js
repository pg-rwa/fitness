"use client";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

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
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exercise) return;

    // Check if video_url already has a direct YouTube ID
    const existingId = extractYouTubeId(exercise.video_url);
    if (existingId) {
      setVideoId(existingId);
      setLoading(false);
      return;
    }

    // Fetch video ID from backend (server-side YouTube search)
    if (exercise.id) {
      api(`/exercises/${exercise.id}/video`)
        .then((d) => {
          if (d.videoId) setVideoId(d.videoId);
          else setError("No video found");
        })
        .catch(() => setError("Could not load video"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError("No video available");
    }
  }, [exercise]);

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

        {/* Video area */}
        <div className="bg-black">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-600 border-t-brand-500" />
            </div>
          )}
          {!loading && videoId && (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
                title={`${exercise.name} demo`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {!loading && !videoId && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-14 h-14 rounded-full bg-red-600/20 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-500 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-4">{error || "Video not available"}</p>
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition inline-flex items-center gap-2"
              >
                Watch on YouTube
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* Fallback link + instructions */}
        <div className="p-4 border-t border-gray-800">
          {videoId && (
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
          )}
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
