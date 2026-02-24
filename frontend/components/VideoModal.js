"use client";
import { useState } from "react";

function extractYouTubeId(url) {
  if (!url) return null;
  // Match youtube.com/watch?v=ID or youtu.be/ID or youtube.com/embed/ID
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
  const [iframeError, setIframeError] = useState(false);
  if (!exercise) return null;

  const videoUrl = exercise.video_url;
  const youtubeId = extractYouTubeId(videoUrl);
  const searchUrl = videoUrl && videoUrl.includes("youtube.com/results")
    ? videoUrl
    : getYouTubeSearchUrl(exercise.name);

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
          {youtubeId && !iframeError ? (
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`}
                title={`${exercise.name} demo`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setIframeError(true)}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm mb-4 text-center">Watch the proper form for this exercise</p>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z"/>
                </svg>
                Watch on YouTube
              </a>
            </div>
          )}
        </div>

        {/* Instructions */}
        {exercise.instructions && (
          <div className="p-4 border-t border-gray-800 max-h-48 overflow-y-auto">
            <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Instructions</h4>
            <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {exercise.instructions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
