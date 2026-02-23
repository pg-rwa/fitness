const db = require('../config/database');

function searchProperties(filters = {}) {
  let conditions = [];
  let params = {};

  if (filters.city) {
    conditions.push("LOWER(p.city) LIKE LOWER(:city)");
    params.city = `%${filters.city}%`;
  }
  if (filters.country) {
    conditions.push("LOWER(p.country) LIKE LOWER(:country)");
    params.country = `%${filters.country}%`;
  }
  if (filters.max_price) {
    conditions.push("p.price_per_night <= :max_price");
    params.max_price = filters.max_price;
  }
  if (filters.min_price) {
    conditions.push("p.price_per_night >= :min_price");
    params.min_price = filters.min_price;
  }
  if (filters.min_guests) {
    conditions.push("p.max_guests >= :min_guests");
    params.min_guests = filters.min_guests;
  }
  if (filters.min_bedrooms) {
    conditions.push("p.bedrooms >= :min_bedrooms");
    params.min_bedrooms = filters.min_bedrooms;
  }
  if (filters.property_type && filters.property_type.length > 0) {
    const typePlaceholders = filters.property_type.map((_, i) => `:type_${i}`);
    conditions.push(`p.property_type IN (${typePlaceholders.join(', ')})`);
    filters.property_type.forEach((t, i) => { params[`type_${i}`] = t; });
  }

  // Amenity filtering — find properties that have specific amenities
  if (filters.amenities && filters.amenities.length > 0) {
    const amenityConditions = filters.amenities.map((_, i) => {
      params[`amenity_${i}`] = `%${filters.amenities[i].toLowerCase()}%`;
      return `EXISTS (SELECT 1 FROM property_amenities pa WHERE pa.property_id = p.id AND LOWER(pa.name) LIKE :amenity_${i})`;
    });
    conditions.push(`(${amenityConditions.join(' AND ')})`);
  }

  // Accessibility filtering
  if (filters.accessibility && filters.accessibility.length > 0) {
    const accConditions = filters.accessibility.map((_, i) => {
      params[`acc_${i}`] = `%${filters.accessibility[i].toLowerCase()}%`;
      return `EXISTS (SELECT 1 FROM property_accessibility pa WHERE pa.property_id = p.id AND LOWER(pa.feature) LIKE :acc_${i})`;
    });
    conditions.push(`(${accConditions.join(' AND ')})`);
  }

  // Pet filtering
  if (filters.pets) {
    conditions.push(`EXISTS (SELECT 1 FROM property_rules pr WHERE pr.property_id = p.id AND pr.rule_type = 'pets' AND pr.value != 'no')`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT p.*
    FROM properties p
    ${whereClause}
    ORDER BY p.rating DESC, p.review_count DESC
    LIMIT 20
  `;

  const properties = db.prepare(query).all(params);

  // Enrich each property with full details
  return properties.map(enrichProperty);
}

function enrichProperty(property) {
  const amenities = db.prepare('SELECT category, name, details FROM property_amenities WHERE property_id = ?').all(property.id);
  const accessibility = db.prepare('SELECT feature, description FROM property_accessibility WHERE property_id = ?').all(property.id);
  const rules = db.prepare('SELECT rule_type, value, details FROM property_rules WHERE property_id = ?').all(property.id);
  const highlights = db.prepare('SELECT highlight FROM property_highlights WHERE property_id = ?').all(property.id);

  return {
    ...property,
    amenities,
    amenities_by_category: amenities.reduce((acc, a) => {
      if (!acc[a.category]) acc[a.category] = [];
      acc[a.category].push({ name: a.name, details: a.details });
      return acc;
    }, {}),
    accessibility,
    rules,
    highlights: highlights.map(h => h.highlight),
  };
}

function getPropertyById(id) {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!property) return null;
  return enrichProperty(property);
}

function getAllProperties() {
  const properties = db.prepare('SELECT * FROM properties ORDER BY rating DESC').all();
  return properties.map(enrichProperty);
}

function getDistinctCities() {
  return db.prepare('SELECT DISTINCT city, country FROM properties ORDER BY country, city').all();
}

function getDistinctAmenities() {
  return db.prepare('SELECT DISTINCT category, name FROM property_amenities ORDER BY category, name').all();
}

module.exports = { searchProperties, getPropertyById, getAllProperties, getDistinctCities, getDistinctAmenities };
