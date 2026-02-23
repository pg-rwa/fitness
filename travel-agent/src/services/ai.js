const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

async function parseRequirements(userMessage, conversationHistory = []) {
  const systemPrompt = `You are StayPicker's requirement parser. Extract structured search requirements from the user's natural language travel query.

Return a JSON object with these fields (omit any that weren't mentioned):
{
  "destination": { "city": string, "country": string, "flexible": boolean },
  "dates": { "checkin": "YYYY-MM-DD", "checkout": "YYYY-MM-DD", "flexible": boolean, "duration_nights": number },
  "guests": { "adults": number, "children": number, "infants": number, "pets": { "type": string, "count": number } },
  "budget": { "min": number, "max": number, "currency": "USD", "per_night": boolean },
  "property_type": [string],  // villa, apartment, house, cabin, etc.
  "bedrooms_min": number,
  "bathrooms_min": number,
  "must_have_amenities": [string],  // specific amenities the user explicitly needs
  "nice_to_have_amenities": [string],  // amenities mentioned as preferences
  "accessibility_needs": [string],  // wheelchair, hearing, visual, step_free, etc.
  "vibe": [string],  // romantic, family, adventure, quiet, party, digital_nomad, luxury, budget, eco
  "priorities": [string],  // ranked list of what matters most to the user
  "dealbreakers": [string]  // absolute no-gos
}

Be thorough — infer reasonable defaults from context. For example:
- "family trip with 2 kids" implies child-friendly amenities needed
- "work trip" implies wifi and workspace are must-haves
- "romantic getaway" implies couples, quiet, possibly luxury
- "hot pool" or "hot spring" maps to the "hot pool" amenity

Return ONLY valid JSON, no markdown formatting.`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse AI response as JSON');
  }
}

async function scoreProperties(requirements, properties) {
  const systemPrompt = `You are StayPicker's property scoring engine. Given user requirements and a list of properties, score each property from 0-100 and provide a short explanation.

For each property, evaluate:
1. Location match (destination, proximity)
2. Budget fit (price within range)
3. Capacity (enough bedrooms, can accommodate guests)
4. Must-have amenities match (critical — missing these = big penalty)
5. Nice-to-have amenities match (bonus points)
6. Accessibility match (if needed — missing accessibility = disqualifying)
7. Vibe/atmosphere fit
8. Rules compatibility (pets, parties, etc.)

Return a JSON array sorted by score (highest first):
[
  {
    "property_id": string,
    "score": number (0-100),
    "match_summary": string (1 sentence why this is/isn't a good match),
    "pros": [string] (top 3 matching strengths),
    "cons": [string] (top concerns or missing items),
    "deal_breaker": boolean (true if a must-have is missing)
  }
]

Be honest and specific. If a property is a poor match, say so clearly.
Return ONLY valid JSON, no markdown.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: JSON.stringify({ requirements, properties }, null, 2)
    }],
  });

  const text = response.content[0].text;
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Failed to parse scoring response');
  }
}

async function chat(userMessage, conversationHistory, searchContext) {
  const systemPrompt = `You are StayPicker, an AI travel concierge that helps users find the perfect stay. You're friendly, knowledgeable, and opinionated (in a helpful way).

Current search context:
${searchContext ? JSON.stringify(searchContext, null, 2) : 'No active search yet.'}

Your capabilities:
- Help users describe what they're looking for
- Explain why certain properties match their needs
- Suggest refinements to their search
- Compare properties side by side
- Answer questions about specific properties or destinations

If the user seems to be describing a new search or refining requirements, include this tag in your response:
[SEARCH_INTENT] - followed by a brief description of what they want to search/refine

Keep responses concise but warm. Use specific details from the properties when discussing them.`;

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  return response.content[0].text;
}

module.exports = { parseRequirements, scoreProperties, chat };
