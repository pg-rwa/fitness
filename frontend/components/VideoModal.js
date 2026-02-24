"use client";

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

function getSearchEmbedUrl(exerciseName) {
  const q = encodeURIComponent(exerciseName + " exercise proper form");
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${q}`;
}

function getYouTubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + " exercise proper form")}`;
}

export default function VideoModal({ exercise, onClose }) {
  if (!exercise) return null;

  const youtubeId = extractYouTubeId(exercise.video_url);

  // Priority: 1) specific video ID from video_url, 2) search-based embed from exercise name
  const embedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0`
    : getSearchEmbedUrl(exercise.name);

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

        {/* Embedded video */}
        <div className="bg-black">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={embedSrc}
              title={`${exercise.name} demo`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Fallback link + instructions */}
        <div className="p-4 border-t border-gray-800">
          {!youtubeId && (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 text-xs inline-flex items-center gap-1 mb-3"
            >
              Video not loading? Search on YouTube
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
          {exercise.instructions && (
            <div className={!youtubeId ? "" : ""}>
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
