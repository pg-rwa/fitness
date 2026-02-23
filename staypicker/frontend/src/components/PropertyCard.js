'use client';

import ScoreRing from './ScoreRing';

const typeIcons = {
  villa: '🏡', apartment: '🏢', house: '🏠', cabin: '🏔️', chalet: '🏔️',
  bungalow: '🌴', treehouse: '🌳', penthouse: '🏙️', cave_house: '🪨', lodge: '🌿',
};

const amenityIcons = {
  pool: '🏊', beach: '🏖️', workspace: '💻', kitchen: '🍳', wellness: '🧖',
  ski: '⛷️', kids: '👶', eco: '♻️', view: '🌅', activity: '🎯',
  fitness: '💪', entertainment: '🎬', service: '🛎️', parking: '🅿️',
  outdoor: '🌿', comfort: '✨', transport: '🚗', security: '🔒',
  smart_home: '🏠', bathroom: '🚿', laundry: '👕',
};

export default function PropertyCard({ property, rank }) {
  const grouped = property.amenities_by_category || {};

  return (
    <div className="card">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {rank && (
                <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  #{rank}
                </span>
              )}
              <span className="text-lg">{typeIcons[property.property_type] || '🏠'}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{property.property_type?.replace('_', ' ')}</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">{property.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{property.city}, {property.country}</p>
          </div>
          {property.score && <ScoreRing score={property.score} />}
        </div>

        {/* Match summary */}
        {property.match_summary && (
          <p className="mt-3 text-sm text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">
            {property.match_summary}
          </p>
        )}

        {/* Description */}
        <p className="mt-3 text-sm text-gray-600 line-clamp-2">{property.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <span className="font-semibold text-2xl text-gray-900">${property.price_per_night}<span className="text-sm font-normal text-gray-500">/night</span></span>
          <span className="text-gray-300">|</span>
          <span>{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
          <span className="text-gray-300">|</span>
          <span>{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
          <span className="text-gray-300">|</span>
          <span>Up to {property.max_guests} guests</span>
          {property.rating > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <span>★ {property.rating} ({property.review_count})</span>
            </>
          )}
        </div>

        {/* Highlights */}
        {property.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {property.highlights.map((h, i) => (
              <span key={i} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Pros & Cons */}
        {(property.pros?.length > 0 || property.cons?.length > 0) && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {property.pros?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">Pros</p>
                {property.pros.map((p, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">+</span> {p}
                  </p>
                ))}
              </div>
            )}
            {property.cons?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-700 mb-1">Considerations</p>
                {property.cons.map((c, i) => (
                  <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-amber-500 mt-0.5">-</span> {c}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Amenity categories */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {Object.entries(grouped).slice(0, 8).map(([cat, items]) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg" title={items.map(i => i.name).join(', ')}>
              {amenityIcons[cat] || '•'} {cat} ({items.length})
            </span>
          ))}
        </div>

        {/* Accessibility badges */}
        {property.accessibility?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {property.accessibility.map((a, i) => (
              <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg border border-purple-200">
                ♿ {a.feature?.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
