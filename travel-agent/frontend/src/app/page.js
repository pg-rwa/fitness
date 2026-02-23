'use client';

import { useState } from 'react';
import PropertyCard from '../components/PropertyCard';
import ChatPanel from '../components/ChatPanel';

const EXAMPLE_SEARCHES = [
  'Family beach house in Portugal with pool, hot tub, and wheelchair access for grandma',
  'Remote cabin in Iceland with a natural hot pool for Northern Lights viewing',
  'Luxury villa in Bali with fast wifi and a dedicated workspace for a month-long workcation',
  'Romantic cave house in Santorini with sunset views and a plunge pool',
  'Ski chalet in Switzerland with hot tub, sauna, and kid-friendly amenities for 10 guests',
  'Pet-friendly eco retreat in Mexico with yoga deck and nature access',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, sessionId }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.details || data.error);
      } else {
        setResults(data);
        setSessionId(data.sessionId);
      }
    } catch (err) {
      setError('Failed to connect to the search service. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewResults = (data) => {
    setResults(data);
  };

  return (
    <div className="min-h-screen">
      {/* Hero / Search */}
      <header className="bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">StayPicker</h1>
            <p className="mt-3 text-brand-200 text-lg">AI-powered travel search that actually understands what you need</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your perfect stay..."
                  className="search-input !border-white/20 !bg-white/10 !text-white placeholder:text-brand-200 !shadow-lg backdrop-blur"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary !bg-white !text-brand-700 hover:!bg-brand-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Searching...
                    </span>
                  ) : 'Search'}
                </button>
              </div>
            </form>

            {/* Example searches */}
            {!results && (
              <div className="mt-6">
                <p className="text-brand-300 text-xs text-center mb-3">Try one of these:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_SEARCHES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(ex); handleSearch(ex); }}
                      className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-brand-100 transition-colors text-left"
                    >
                      {ex.length > 60 ? ex.slice(0, 60) + '...' : ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Error */}
      {error && (
        <div className="max-w-5xl mx-auto px-4 mt-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <main className="max-w-5xl mx-auto px-4 py-8">
          {/* Requirements parsed */}
          {results.requirements && (
            <div className="mb-6 card p-4">
              <h2 className="font-semibold text-sm text-gray-700 mb-2">Understood Requirements</h2>
              <div className="flex flex-wrap gap-2">
                {results.requirements.destination && (
                  <span className="btn-secondary text-xs">
                    📍 {results.requirements.destination.city || results.requirements.destination.country}
                  </span>
                )}
                {results.requirements.budget?.max && (
                  <span className="btn-secondary text-xs">
                    💰 Up to ${results.requirements.budget.max}/night
                  </span>
                )}
                {results.requirements.guests?.adults && (
                  <span className="btn-secondary text-xs">
                    👥 {results.requirements.guests.adults} adult{results.requirements.guests.adults > 1 ? 's' : ''}
                    {results.requirements.guests.children ? ` + ${results.requirements.guests.children} kid${results.requirements.guests.children > 1 ? 's' : ''}` : ''}
                  </span>
                )}
                {results.requirements.must_have_amenities?.map((a, i) => (
                  <span key={i} className="btn-secondary text-xs !border-green-200 !text-green-700 !bg-green-50">
                    ✓ {a}
                  </span>
                ))}
                {results.requirements.accessibility_needs?.map((a, i) => (
                  <span key={i} className="btn-secondary text-xs !border-purple-200 !text-purple-700 !bg-purple-50">
                    ♿ {a}
                  </span>
                ))}
                {results.requirements.vibe?.map((v, i) => (
                  <span key={i} className="btn-secondary text-xs !border-amber-200 !text-amber-700 !bg-amber-50">
                    ✦ {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property results */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-gray-900">
                  {results.results?.length > 0
                    ? `Top ${results.results.length} Match${results.results.length > 1 ? 'es' : ''}`
                    : 'No Matches Found'}
                </h2>
                {results.totalMatches > 0 && (
                  <span className="text-sm text-gray-500">{results.totalMatches} total</span>
                )}
              </div>

              {results.results?.map((property, i) => (
                <PropertyCard key={property.id} property={property} rank={i + 1} />
              ))}

              {results.results?.length === 0 && (
                <div className="card p-8 text-center">
                  <p className="text-gray-500">No properties matched all your requirements.</p>
                  <p className="text-sm text-gray-400 mt-1">Try broadening your search or use the chat to adjust criteria.</p>
                </div>
              )}

              {/* Eliminated properties */}
              {results.eliminated?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Eliminated ({results.eliminated.length})
                  </p>
                  {results.eliminated.map((e, i) => (
                    <p key={i} className="text-xs text-gray-400 mb-1">
                      ✕ {e.name} — {e.reason}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Chat panel */}
            <div className="lg:col-span-1">
              <ChatPanel sessionId={sessionId} onNewResults={handleNewResults} />
            </div>
          </div>
        </main>
      )}

      {/* Features when no results */}
      {!results && !loading && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">Filters You Won&apos;t Find Elsewhere</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '♨️', title: 'Hot Pool / Onsen', desc: 'Natural hot springs, geothermal pools, heated outdoor pools — not just "pool: yes"' },
              { icon: '♿', title: 'Real Accessibility', desc: 'Wheelchair access, grab bars, roll-in showers, visual alerts, hearing accessible, pool lifts' },
              { icon: '💻', title: 'Work-From-Anywhere', desc: 'Dedicated desk, fast wifi (with Mbps), external monitors, ergonomic chairs' },
              { icon: '🐾', title: 'Detailed Pet Policy', desc: 'Not just "pet-friendly" — size limits, breed restrictions, fenced yards, per-pet fees' },
              { icon: '🤫', title: 'Noise & Vibe', desc: 'Party-friendly vs. quiet retreat vs. moderate — know before you book' },
              { icon: '🌱', title: 'Eco & Sustainability', desc: 'Solar-powered, geothermal, composting, carbon-neutral — travel responsibly' },
            ].map((f, i) => (
              <div key={i} className="card p-6 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="text-center py-8 text-xs text-gray-400 border-t border-gray-100">
        StayPicker — Built with AI, designed for travelers who know what they want.
      </footer>
    </div>
  );
}
