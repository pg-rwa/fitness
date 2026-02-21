"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

const EVENT_COLORS = {
  workout_session: { bg: "bg-brand-500/20", text: "text-brand-500", dot: "bg-brand-500", label: "Workout" },
  assigned_workout: { bg: "bg-blue-500/20", text: "text-blue-400", dot: "bg-blue-400", label: "Assigned" },
  measurement: { bg: "bg-green-500/20", text: "text-green-400", dot: "bg-green-400", label: "Measurement" },
  progress_photo: { bg: "bg-purple-500/20", text: "text-purple-400", dot: "bg-purple-400", label: "Photo" },
  scheduled_session: { bg: "bg-yellow-500/20", text: "text-yellow-400", dot: "bg-yellow-400", label: "Session" },
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState("month");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    api(`/calendar?start=${start}&end=${end}`)
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]));
  }, [year, month]);

  const eventsForDate = (dateStr) =>
    events.filter((e) => e.datetime && e.datetime.startsWith(dateStr));

  const navigate = (dir) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
    setSelectedDate(null);
  };

  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(today);
  };

  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });
  const days = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  // Week view
  const getWeekDates = () => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const wd = new Date(start);
      wd.setDate(start.getDate() + i);
      dates.push(wd);
    }
    return dates;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "month" ? "week" : "month")}
            className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs hover:bg-gray-700"
          >
            {view === "month" ? "Week View" : "Month View"}
          </button>
          <button onClick={goToday} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs hover:bg-brand-600">
            Today
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h2 className="text-white font-semibold">{monthName}</h2>
        <button onClick={() => navigate(1)} className="text-gray-400 hover:text-white p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(EVENT_COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${val.dot}`} />
            <span className="text-gray-400 text-xs">{val.label}</span>
          </div>
        ))}
      </div>

      {view === "month" ? (
        /* Month grid */
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="grid grid-cols-7 gap-px mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-gray-500 text-xs font-medium text-center py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px">
            {days.map((day, i) => {
              if (!day) return <div key={`e-${i}`} className="h-16" />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayEvents = eventsForDate(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-16 rounded-lg p-1 text-left transition-colors relative ${
                    isSelected ? "bg-brand-500/20 border border-brand-500" :
                    isToday ? "bg-gray-800 border border-gray-600" :
                    "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-brand-500" : "text-gray-300"}`}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.type]?.dot || "bg-gray-500"}`} />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-gray-500 text-[8px]">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Week view */
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="grid grid-cols-7 gap-2">
            {getWeekDates().map((wd) => {
              const dateStr = wd.toISOString().split("T")[0];
              const dayEvents = eventsForDate(dateStr);
              const isToday = dateStr === today;
              const isSelected = dateStr === selectedDate;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`rounded-xl p-2 min-h-[120px] transition-colors ${
                    isSelected ? "bg-brand-500/20 border border-brand-500" :
                    isToday ? "bg-gray-800 border border-gray-600" :
                    "hover:bg-gray-800 border border-transparent"
                  }`}
                >
                  <div className="text-center mb-2">
                    <p className="text-gray-500 text-[10px]">{wd.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className={`text-sm font-bold ${isToday ? "text-brand-500" : "text-white"}`}>{wd.getDate()}</p>
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 4).map((e, j) => (
                      <div key={j} className={`text-[9px] px-1 py-0.5 rounded ${EVENT_COLORS[e.type]?.bg || "bg-gray-700"} ${EVENT_COLORS[e.type]?.text || "text-gray-400"} truncate`}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Event detail panel */}
      <div className="mt-4">
        {selectedDate && (
          <div>
            <h3 className="text-white font-semibold text-sm mb-2">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedEvents.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-gray-600 text-sm">No events on this day</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedEvents.map((e, i) => {
                  const style = EVENT_COLORS[e.type] || { bg: "bg-gray-700", text: "text-gray-400", label: e.type };
                  const time = e.datetime ? new Date(e.datetime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
                  return (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                      <div className={`w-1 h-10 rounded-full ${style.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{e.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${style.text}`}>{style.label}</span>
                          {time && <span className="text-gray-500 text-xs">{time}</span>}
                          {e.status && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              e.status === "completed" ? "bg-green-500/20 text-green-400" :
                              e.status === "scheduled" ? "bg-blue-500/20 text-blue-400" :
                              "bg-gray-700 text-gray-400"
                            }`}>{e.status}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
