"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";

const statusColors = {
  requested: "text-yellow-400 bg-yellow-400/10",
  proposed: "text-orange-400 bg-orange-400/10",
  approved: "text-green-400 bg-green-400/10",
  declined: "text-red-400 bg-red-400/10",
  completed: "text-blue-400 bg-blue-400/10",
  cancelled: "text-gray-400 bg-gray-400/10",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = [];
for (let h = 6; h <= 21; h++) {
  HOURS.push(`${String(h).padStart(2, "0")}:00`);
  HOURS.push(`${String(h).padStart(2, "0")}:30`);
}

// ─── Trainer Availability Editor ────────────────────────────

function AvailabilityEditor({ availability, onSave }) {
  const [slots, setSlots] = useState([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setSlots(availability.filter((a) => a.is_active).map((a) => ({
      dayOfWeek: a.day_of_week, startTime: a.start_time, endTime: a.end_time,
    })));
  }, [availability]);

  const addSlot = () => {
    setSlots([...slots, { dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }]);
  };

  const updateSlot = (idx, field, value) => {
    const updated = [...slots];
    updated[idx] = { ...updated[idx], [field]: field === "dayOfWeek" ? parseInt(value) : value };
    setSlots(updated);
  };

  const removeSlot = (idx) => setSlots(slots.filter((_, i) => i !== idx));

  const save = async () => {
    if (slots.length === 0) return;
    await onSave(slots);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Your Availability</h2>
          <button onClick={() => setEditing(true)} className="text-brand-400 text-xs hover:text-brand-300">Edit</button>
        </div>
        {slots.length === 0 ? (
          <p className="text-gray-600 text-sm">No availability set. Click Edit to add your available times.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s, i) => (
              <span key={i} className="text-xs bg-green-400/10 text-green-400 px-2.5 py-1 rounded-full">
                {DAYS[s.dayOfWeek]} {s.startTime}-{s.endTime}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
      <h2 className="text-white font-semibold text-sm mb-3">Edit Availability</h2>
      <div className="space-y-2 mb-3">
        {slots.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select value={s.dayOfWeek} onChange={(e) => updateSlot(idx, "dayOfWeek", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
            <select value={s.startTime} onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-gray-500 text-xs">to</span>
            <select value={s.endTime} onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
            <button onClick={() => removeSlot(idx)} className="text-gray-500 hover:text-red-400 text-xs px-1">X</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={addSlot} className="px-3 py-1.5 border border-dashed border-gray-700 text-gray-400 rounded-lg text-xs hover:border-brand-500 hover:text-brand-400">+ Add Slot</button>
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-gray-400 text-xs">Cancel</button>
        <button onClick={save} className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600">Save</button>
      </div>
    </div>
  );
}

// ─── Client Booking Flow ────────────────────────────────────

function BookingForm({ trainerId, onBooked, onCancel }) {
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [title, setTitle] = useState("Training Session");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadSlots = async (d) => {
    setDate(d);
    setSelectedSlot(null);
    setLoading(true);
    try {
      const data = await api(`/scheduling/sessions/available-slots?trainerId=${trainerId}&date=${d}`);
      setSlots(Array.isArray(data) ? data : []);
    } catch { setSlots([]); }
    setLoading(false);
  };

  const book = async () => {
    if (!selectedSlot || !title.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const scheduledStart = `${date}T${selectedSlot.start_time}:00`;
      const scheduledEnd = `${date}T${selectedSlot.end_time}:00`;
      await api("/scheduling/sessions", {
        method: "POST",
        body: { trainerId, title, scheduledStart, scheduledEnd, notes: notes || undefined },
      });
      onBooked();
    } catch (err) {
      setError(err.message || "Failed to request session");
    }
    setSubmitting(false);
  };

  // Generate next 14 days
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
      <h3 className="text-white font-semibold text-sm mb-3">Request an Appointment</h3>
      {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Session title"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none mb-3" />

      <label className="block text-gray-400 text-xs font-medium mb-1.5">Pick a date</label>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {dates.map((d) => {
          const dt = new Date(d + "T12:00:00");
          const isSelected = d === date;
          return (
            <button key={d} onClick={() => loadSlots(d)}
              className={`flex-shrink-0 w-16 py-2 rounded-lg text-center border transition ${isSelected ? "bg-brand-500/20 border-brand-500 text-brand-400" : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600"}`}>
              <p className="text-[10px]">{dt.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <p className="text-sm font-bold">{dt.getDate()}</p>
              <p className="text-[10px]">{dt.toLocaleDateString("en-US", { month: "short" })}</p>
            </button>
          );
        })}
      </div>

      {date && (
        <>
          <label className="block text-gray-400 text-xs font-medium mb-1.5">Available slots</label>
          {loading ? (
            <p className="text-gray-500 text-sm py-2">Checking availability...</p>
          ) : slots.length === 0 ? (
            <p className="text-gray-600 text-sm py-2">No available slots on this day. Try another date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {slots.map((s, i) => (
                <button key={i} onClick={() => setSelectedSlot(s)}
                  className={`py-2 rounded-lg text-xs font-medium border transition ${selectedSlot === s ? "bg-brand-500 text-white border-brand-500" : "bg-gray-800 text-gray-300 border-gray-700 hover:border-brand-500/50"}`}>
                  {s.start_time} - {s.end_time}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)"
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none mb-3" />

      <div className="flex gap-2">
        <button onClick={onCancel} className="px-4 py-2 text-gray-400 text-sm">Cancel</button>
        <button onClick={book} disabled={!selectedSlot || !title.trim() || submitting}
          className="flex-1 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 disabled:opacity-50">
          {submitting ? "Requesting..." : "Request Appointment"}
        </button>
      </div>
    </div>
  );
}

// ─── Propose New Time (Trainer) ─────────────────────────────

function ProposeForm({ session, onDone }) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const propose = async () => {
    if (!date) return;
    setSubmitting(true); setError(null);
    try {
      await api(`/scheduling/sessions/${session.id}/propose`, {
        method: "PUT",
        body: { scheduledStart: `${date}T${startTime}:00`, scheduledEnd: `${date}T${endTime}:00`, reason },
      });
      onDone();
    } catch (err) {
      setError(err.message || "Failed to propose");
    }
    setSubmitting(false);
  };

  return (
    <div className="mt-3 bg-gray-800 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-2">Propose a new time:</p>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <div className="flex flex-wrap gap-2 mb-2">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none" />
        <select value={startTime} onChange={(e) => setStartTime(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-gray-500 text-xs self-center">to</span>
        <select value={endTime} onChange={(e) => setEndTime(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none">
          {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)"
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:border-brand-500 focus:outline-none mb-2" />
      <div className="flex gap-2">
        <button onClick={onDone} className="text-gray-500 text-xs">Cancel</button>
        <button onClick={propose} disabled={!date || submitting}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 disabled:opacity-50">
          {submitting ? "Sending..." : "Send Proposal"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Schedule Page ─────────────────────────────────────

export default function SchedulePage() {
  const { user } = useAuth();
  const isTrainer = user?.role === "trainer" || user?.role === "admin";
  const [sessions, setSessions] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [showBooking, setShowBooking] = useState(false);
  const [proposingId, setProposingId] = useState(null);
  const [trainerId, setTrainerId] = useState(null);

  const loadSessions = useCallback(() => {
    api("/scheduling/sessions?limit=50").then((d) => setSessions(d.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadSessions();
    if (isTrainer) {
      api("/scheduling/availability").then((d) => setAvailability(Array.isArray(d) ? d : d.data || [])).catch(() => {});
    } else if (user?.trainer_id) {
      setTrainerId(user.trainer_id);
    }
  }, [isTrainer, user, loadSessions]);

  const updateStatus = async (id, action, body = {}) => {
    try {
      await api(`/scheduling/sessions/${id}/${action}`, { method: "PUT", body });
      loadSessions();
    } catch {}
  };

  const saveAvailability = async (slots) => {
    try {
      const data = await api("/scheduling/availability", { method: "PUT", body: { slots } });
      setAvailability(Array.isArray(data) ? data : []);
    } catch {}
  };

  const pending = sessions.filter((s) => ["requested", "proposed"].includes(s.status));
  const upcoming = sessions.filter((s) => s.status === "approved");
  const past = sessions.filter((s) => ["completed", "declined", "cancelled"].includes(s.status));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Schedule</h1>
        {!isTrainer && trainerId && (
          <button onClick={() => setShowBooking(!showBooking)}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
            {showBooking ? "Cancel" : "Request Appointment"}
          </button>
        )}
      </div>

      {/* Trainer: Availability Editor */}
      {isTrainer && <AvailabilityEditor availability={availability} onSave={saveAvailability} />}

      {/* Client: Booking Form */}
      {showBooking && trainerId && (
        <BookingForm trainerId={trainerId} onBooked={() => { setShowBooking(false); loadSessions(); }} onCancel={() => setShowBooking(false)} />
      )}

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-2">
            {isTrainer ? "Pending Requests" : "Pending"}
          </h2>
          <div className="space-y-2">
            {pending.map((s) => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{s.title || "Session"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(s.scheduled_start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {" - "}
                      {new Date(s.scheduled_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {isTrainer ? `Client: ${s.client_name || ""}` : `Trainer: ${s.trainer_name || ""}`}
                      {s.location && ` · ${s.location}`}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[s.status] || ""}`}>
                    {s.status}
                  </span>
                </div>

                {s.decline_reason && s.status === "proposed" && (
                  <p className="text-orange-400/80 text-xs mt-2 bg-orange-400/5 rounded px-2 py-1">{s.decline_reason}</p>
                )}

                {/* Trainer actions on requested */}
                {isTrainer && s.status === "requested" && (
                  <div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => updateStatus(s.id, "approve")}
                        className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20">Approve</button>
                      <button onClick={() => setProposingId(proposingId === s.id ? null : s.id)}
                        className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs hover:bg-orange-500/20">Propose New Time</button>
                      <button onClick={() => updateStatus(s.id, "decline")}
                        className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20">Decline</button>
                    </div>
                    {proposingId === s.id && <ProposeForm session={s} onDone={() => { setProposingId(null); loadSessions(); }} />}
                  </div>
                )}

                {/* Client actions on proposed */}
                {!isTrainer && s.status === "proposed" && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateStatus(s.id, "accept-proposal")}
                      className="px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-xs hover:bg-green-500/20">Accept New Time</button>
                    <button onClick={() => updateStatus(s.id, "decline-proposal")}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20">Decline</button>
                  </div>
                )}

                {/* Client can cancel requested */}
                {!isTrainer && s.status === "requested" && (
                  <button onClick={() => updateStatus(s.id, "cancel")}
                    className="mt-2 px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs hover:text-red-400">Cancel Request</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming approved */}
      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">Upcoming</h2>
          <div className="space-y-2">
            {upcoming.map((s) => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{s.title || "Session"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(s.scheduled_start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      {" - "}
                      {new Date(s.scheduled_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {isTrainer ? `Client: ${s.client_name || ""}` : `Trainer: ${s.trainer_name || ""}`}
                      {s.location && ` · ${s.location}`}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full text-green-400 bg-green-400/10">Confirmed</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {isTrainer && (
                    <button onClick={() => updateStatus(s.id, "complete")}
                      className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs hover:bg-blue-500/20">Mark Complete</button>
                  )}
                  <button onClick={() => updateStatus(s.id, "cancel")}
                    className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-xs hover:text-red-400">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past sessions */}
      {past.length > 0 && (
        <div>
          <h2 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Past</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 opacity-70">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium text-sm">{s.title || "Session"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(s.scheduled_start).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {isTrainer ? s.client_name : s.trainer_name}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${statusColors[s.status] || ""}`}>
                    {s.status}
                  </span>
                </div>
                {s.decline_reason && <p className="text-gray-500 text-xs mt-1">{s.decline_reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && !showBooking && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-sm">No scheduled sessions yet</p>
          {!isTrainer && trainerId && (
            <button onClick={() => setShowBooking(true)}
              className="mt-3 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600">
              Request Your First Appointment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
