"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { useAuth } from "../../../components/AuthProvider";

const INSIGHT_STYLES = {
  trend: { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "text-blue-400", bg: "bg-blue-500/20" },
  habit: { icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z", color: "text-green-400", bg: "bg-green-500/20" },
  tip: { icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  milestone: { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", color: "text-brand-500", bg: "bg-brand-500/20" },
  warning: { icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-red-400", bg: "bg-red-500/20" },
  recommendation: { icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "text-purple-400", bg: "bg-purple-500/20" },
};

export default function InsightsPage() {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    setLoading(true);
    api("/insights?limit=20")
      .then((d) => setInsights(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const newInsights = await api("/insights/generate", { method: "POST" });
      if (Array.isArray(newInsights)) {
        setInsights((prev) => [...newInsights, ...prev]);
      }
    } catch {}
    setGenerating(false);
  };

  const markRead = async (id) => {
    try {
      await api(`/insights/${id}/read`, { method: "PUT" });
      setInsights((prev) => prev.map((i) => (i.id === id ? { ...i, is_read: 1 } : i)));
    } catch {}
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-white text-xl font-bold">AI Insights</h1>
          <p className="text-gray-500 text-sm mt-0.5">Personalized analysis of your fitness journey</p>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Insights
            </>
          )}
        </button>
      </div>

      {/* Summary cards */}
      {!loading && insights.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {Object.entries(
            insights.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {})
          ).map(([type, count]) => {
            const style = INSIGHT_STYLES[type] || INSIGHT_STYLES.tip;
            return (
              <div key={type} className={`${style.bg} rounded-xl p-3`}>
                <span className={`${style.color} text-2xl font-bold`}>{count}</span>
                <p className="text-gray-400 text-xs capitalize mt-0.5">{type}s</p>
              </div>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-400 font-medium">No insights yet</p>
          <p className="text-gray-600 text-sm mt-1">Click "Generate Insights" to get AI-powered analysis of your fitness data</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => {
            const style = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.tip;
            const data = typeof insight.data === "string" ? JSON.parse(insight.data) : insight.data;

            return (
              <div
                key={insight.id}
                onClick={() => !insight.is_read && markRead(insight.id)}
                className={`bg-gray-900 border rounded-xl p-4 transition-colors cursor-pointer ${
                  insight.is_read ? "border-gray-800" : "border-gray-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${style.bg} p-2 rounded-lg shrink-0`}>
                    <svg className={`w-5 h-5 ${style.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={style.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm">{insight.title}</h3>
                      {!insight.is_read && <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />}
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{insight.body}</p>

                    {/* Data points */}
                    {data && Object.keys(data).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(data).map(([key, value]) => (
                          <span key={key} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                            {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim()}: <span className="text-white">{typeof value === "number" ? Math.round(value * 10) / 10 : String(value)}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs capitalize ${style.color}`}>{insight.type}</span>
                      {insight.generated_at && (
                        <span className="text-gray-600 text-xs">{formatDate(insight.generated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
