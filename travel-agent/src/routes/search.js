const express = require('express');
const router = express.Router();
const orchestrator = require('../agents/orchestrator');
const propertyDb = require('../services/property-db');

// POST /api/search — natural language property search
router.post('/', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const sid = sessionId || `session_${Date.now()}`;
    const results = await orchestrator.search(sid, query);

    res.json({ sessionId: sid, ...results });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// POST /api/search/chat — conversational follow-up
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const result = await orchestrator.converse(sessionId, message);

    // If the AI suggests a search, auto-execute it
    if (result.shouldSearch) {
      const searchResults = await orchestrator.search(sessionId, message);
      return res.json({
        message: result.message,
        searchResults: { sessionId, ...searchResults },
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});

// GET /api/search/properties — browse all properties
router.get('/properties', (req, res) => {
  try {
    const filters = {};
    if (req.query.city) filters.city = req.query.city;
    if (req.query.country) filters.country = req.query.country;
    if (req.query.max_price) filters.max_price = Number(req.query.max_price);
    if (req.query.min_guests) filters.min_guests = Number(req.query.min_guests);
    if (req.query.type) filters.property_type = req.query.type.split(',');
    if (req.query.amenities) filters.amenities = req.query.amenities.split(',');
    if (req.query.accessibility) filters.accessibility = req.query.accessibility.split(',');
    if (req.query.pets === 'true') filters.pets = true;

    const properties = propertyDb.searchProperties(filters);
    res.json({ count: properties.length, properties });
  } catch (err) {
    console.error('Properties error:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

// GET /api/search/properties/:id — single property details
router.get('/properties/:id', (req, res) => {
  const property = propertyDb.getPropertyById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
});

// GET /api/search/destinations — available destinations
router.get('/destinations', (req, res) => {
  const cities = propertyDb.getDistinctCities();
  res.json(cities);
});

// GET /api/search/amenities — available amenity types
router.get('/amenities', (req, res) => {
  const amenities = propertyDb.getDistinctAmenities();
  res.json(amenities);
});

module.exports = router;
