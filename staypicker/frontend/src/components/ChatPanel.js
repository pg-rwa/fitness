'use client';

import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ sessionId, onNewResults }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || !sessionId) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/search/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, sessionId }),
      });
      const data = await res.json();

      if (data.searchResults) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Updated results based on your request.' }]);
        onNewResults?.(data.searchResults);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="card flex flex-col h-[400px]">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-700">Refine Your Search</h3>
        <p className="text-xs text-gray-500">Ask me to adjust results, compare properties, or change criteria</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Try asking:</p>
            <div className="mt-2 space-y-1">
              {['Show me something cheaper', 'I need wheelchair access', 'Which has the best wifi?', 'Compare the top 2'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="block mx-auto text-xs text-brand-600 hover:text-brand-700 hover:underline"
                >
                  &ldquo;{q}&rdquo;
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-700 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Refine your search..."
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary text-sm px-4 py-2">
          Send
        </button>
      </form>
    </div>
  );
}
