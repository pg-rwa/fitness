const { parseRequirements, scoreProperties, chat } = require('../services/ai');
const propertyDb = require('../services/property-db');

class SearchOrchestrator {
  constructor() {
    this.sessions = new Map();
  }

  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        messages: [],
        requirements: null,
        results: null,
        lastSearch: null,
      });
    }
    return this.sessions.get(sessionId);
  }

  async search(sessionId, userMessage) {
    const session = this.getSession(sessionId);

    // Store user message
    session.messages.push({ role: 'user', content: userMessage });

    // Step 1: Parse requirements from natural language
    const requirements = await parseRequirements(userMessage, session.messages.slice(0, -1));
    session.requirements = requirements;

    // Step 2: Build database filters from parsed requirements
    const filters = this._buildFilters(requirements);

    // Step 3: Query database with filters
    let candidates = propertyDb.searchProperties(filters);

    // If strict filtering returns nothing, broaden the search
    if (candidates.length === 0) {
      const broadFilters = this._buildBroadFilters(requirements);
      candidates = propertyDb.searchProperties(broadFilters);
    }

    // If still nothing, return all properties for AI to evaluate
    if (candidates.length === 0) {
      candidates = propertyDb.getAllProperties();
    }

    // Step 4: AI scores and ranks candidates against requirements
    const scored = await scoreProperties(requirements, candidates.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      property_type: c.property_type,
      city: c.city,
      country: c.country,
      price_per_night: c.price_per_night,
      max_guests: c.max_guests,
      bedrooms: c.bedrooms,
      bathrooms: c.bathrooms,
      rating: c.rating,
      review_count: c.review_count,
      amenities: c.amenities,
      accessibility: c.accessibility,
      rules: c.rules,
      highlights: c.highlights,
    })));

    // Step 5: Merge scores with full property data
    const results = scored
      .filter(s => !s.deal_breaker)
      .map(s => {
        const property = candidates.find(c => c.id === s.property_id);
        return {
          ...property,
          score: s.score,
          match_summary: s.match_summary,
          pros: s.pros,
          cons: s.cons,
        };
      })
      .sort((a, b) => b.score - a.score);

    const dealBreakers = scored
      .filter(s => s.deal_breaker)
      .map(s => {
        const property = candidates.find(c => c.id === s.property_id);
        return {
          name: property?.name,
          reason: s.cons?.[0] || s.match_summary,
        };
      });

    session.results = results;
    session.lastSearch = {
      query: userMessage,
      requirements,
      filters,
      candidateCount: candidates.length,
      resultCount: results.length,
    };

    // Store assistant response
    const summary = this._buildSummary(results, requirements);
    session.messages.push({ role: 'assistant', content: summary });

    return {
      requirements,
      results: results.slice(0, 5),
      totalMatches: results.length,
      eliminated: dealBreakers,
      searchMeta: session.lastSearch,
    };
  }

  async converse(sessionId, userMessage) {
    const session = this.getSession(sessionId);
    session.messages.push({ role: 'user', content: userMessage });

    const response = await chat(userMessage, session.messages.slice(0, -1), {
      requirements: session.requirements,
      results: session.results?.slice(0, 5),
    });

    // Check if AI detected a search intent
    if (response.includes('[SEARCH_INTENT]')) {
      const cleanResponse = response.replace(/\[SEARCH_INTENT\].*$/m, '').trim();
      session.messages.push({ role: 'assistant', content: cleanResponse });

      return {
        type: 'search_suggested',
        message: cleanResponse,
        shouldSearch: true,
      };
    }

    session.messages.push({ role: 'assistant', content: response });

    return {
      type: 'message',
      message: response,
      shouldSearch: false,
    };
  }

  _buildFilters(req) {
    const filters = {};

    if (req.destination?.city) filters.city = req.destination.city;
    if (req.destination?.country) filters.country = req.destination.country;
    if (req.budget?.max) filters.max_price = req.budget.per_night ? req.budget.max : req.budget.max;
    if (req.budget?.min) filters.min_price = req.budget.per_night ? req.budget.min : req.budget.min;

    const totalGuests = (req.guests?.adults || 0) + (req.guests?.children || 0);
    if (totalGuests > 0) filters.min_guests = totalGuests;

    if (req.bedrooms_min) filters.min_bedrooms = req.bedrooms_min;
    if (req.property_type?.length) filters.property_type = req.property_type;
    if (req.must_have_amenities?.length) filters.amenities = req.must_have_amenities;
    if (req.accessibility_needs?.length) filters.accessibility = req.accessibility_needs;
    if (req.guests?.pets) filters.pets = true;

    return filters;
  }

  _buildBroadFilters(req) {
    // Relaxed filters — just location and capacity
    const filters = {};
    if (req.destination?.country) filters.country = req.destination.country;
    const totalGuests = (req.guests?.adults || 0) + (req.guests?.children || 0);
    if (totalGuests > 0) filters.min_guests = totalGuests;
    return filters;
  }

  _buildSummary(results, requirements) {
    if (results.length === 0) {
      return `No properties found matching all your requirements. Try broadening your search.`;
    }
    const top = results[0];
    return `Found ${results.length} matching properties. Top pick: ${top.name} in ${top.city} (${top.score}/100 match) — $${top.price_per_night}/night.`;
  }
}

module.exports = new SearchOrchestrator();
