"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";
import Link from "next/link";

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [trainerRequests, setTrainerRequests] = useState([]);
  const [inviteResult, setInviteResult] = useState(null);
  const [requestResult, setRequestResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadData = () => {
    api("/users/my-clients")
      .then((d) => setClients(Array.isArray(d) ? d : []))
      .catch(() => {
        // Fallback to admin endpoint
        api("/admin/users?limit=100")
          .then((d) => {
            const all = d.data || [];
            setClients(all.filter((u) => u.trainer_id === user?.id && u.role === "client"));
          })
          .catch(() => {});
      });

    api("/auth/invitations")
      .then((d) => setInvitations(Array.isArray(d) ? d : d.invitations || d.data || []))
      .catch(() => {});

    api("/users/trainer-requests")
      .then((d) => setTrainerRequests(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const sendInvite = async () => {
    try {
      const data = await api("/auth/invitations", {
        method: "POST",
        body: { email: inviteEmail, role: "client" },
      });
      setInviteResult(data);
      setInviteEmail("");
      loadData();
    } catch (err) {
      // If user already exists, suggest "Add Existing Client" flow
      const msg = err.message || "Failed to send invitation";
      setInviteResult({ error: msg });
    }
  };

  const revokeInvite = async (id) => {
    try {
      await api(`/auth/invitations/${id}`, { method: "DELETE" });
      loadData();
    } catch {}
  };

  const handleSearch = async () => {
    if (searchEmail.length < 3) return;
    setSearchLoading(true);
    setRequestResult(null);
    try {
      const results = await api(`/users/search-clients?email=${encodeURIComponent(searchEmail)}`);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const sendRequest = async (clientId) => {
    try {
      await api("/users/trainer-requests", {
        method: "POST",
        body: { clientId },
      });
      setRequestResult({ success: true });
      handleSearch(); // refresh results
      loadData();
    } catch (err) {
      setRequestResult({ error: err.message || "Failed to send request" });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowSearch(!showSearch); setShowInvite(false); }}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 border border-gray-700"
          >
            Add Existing Client
          </button>
          <button
            onClick={() => { setShowInvite(!showInvite); setShowSearch(false); }}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
          >
            Invite New Client
          </button>
        </div>
      </div>

      {/* Search & Add Existing Client */}
      {showSearch && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">Search Existing Clients by Email</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by email..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading || searchEmail.length < 3}
              className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {searchLoading ? "Searching..." : "Search"}
            </button>
          </div>

          {requestResult?.success && (
            <div className="mb-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-sm">Request sent! Waiting for client approval.</p>
            </div>
          )}
          {requestResult?.error && (
            <div className="mb-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{requestResult.error}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-white text-sm font-medium">{c.first_name} {c.last_name}</p>
                    <p className="text-gray-500 text-xs">{c.email}</p>
                  </div>
                  <div>
                    {c.is_my_client ? (
                      <span className="text-green-400 text-xs px-2 py-1 bg-green-400/10 rounded-full">Already your client</span>
                    ) : c.has_trainer ? (
                      <span className="text-yellow-400 text-xs px-2 py-1 bg-yellow-400/10 rounded-full">Has a trainer</span>
                    ) : (
                      <button
                        onClick={() => sendRequest(c.id)}
                        className="px-3 py-1.5 bg-brand-500 text-white rounded-lg text-xs font-medium hover:bg-brand-600"
                      >
                        Send Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchResults.length === 0 && searchEmail.length >= 3 && !searchLoading && (
            <p className="text-gray-600 text-sm">No clients found matching that email.</p>
          )}
        </div>
      )}

      {/* Invite New Client */}
      {showInvite && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">Invite New Client</h3>
          <p className="text-gray-500 text-xs mb-3">Send an invitation to someone who hasn&apos;t registered yet.</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="client@example.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
            />
            <button onClick={sendInvite} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium">
              Send
            </button>
          </div>
          {inviteResult && !inviteResult.error && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              {inviteResult.type === "trainer_request" ? (
                <p className="text-green-400 text-sm">{inviteResult.message}</p>
              ) : (
                <>
                  <p className="text-green-400 text-sm">Invitation sent! Share this link with your client:</p>
                  {inviteResult.token && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/register?token=${inviteResult.token}`}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300 text-xs font-mono truncate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const link = `${window.location.origin}/register?token=${inviteResult.token}`;
                          try {
                            if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(link).then(() => {
                                setCopied(true);
                                setTimeout(() => setCopied(false), 2000);
                              });
                            } else {
                              const ta = document.createElement("textarea");
                              ta.value = link;
                              ta.style.position = "fixed";
                              ta.style.left = "-9999px";
                              document.body.appendChild(ta);
                              ta.select();
                              document.execCommand("copy");
                              document.body.removeChild(ta);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          } catch {
                            setCopied(false);
                          }
                        }}
                        className={`px-3 py-2 border rounded-lg text-xs transition shrink-0 ${copied ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"}`}
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {inviteResult?.error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{inviteResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <div className="mb-4">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Pending Invitations</h3>
          <div className="space-y-1.5">
            {invitations.filter((i) => i.status === "pending").map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-white text-sm">{inv.email}</p>
                  <p className="text-gray-600 text-xs">Sent {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => revokeInvite(inv.id)} className="text-xs text-gray-500 hover:text-red-400">Revoke</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Trainer Requests */}
      {trainerRequests.filter((r) => r.status === "pending").length > 0 && (
        <div className="mb-4">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Pending Requests</h3>
          <div className="space-y-1.5">
            {trainerRequests.filter((r) => r.status === "pending").map((req) => (
              <div key={req.id} className="flex items-center justify-between bg-gray-900 border border-yellow-500/20 rounded-lg px-4 py-2.5">
                <div>
                  <p className="text-white text-sm">{req.client_name || req.client_email}</p>
                  <p className="text-yellow-500 text-xs">Awaiting approval</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Clients */}
      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Clients</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {clients.map((c) => (
          <Link key={c.id} href={`/dashboard/clients/${c.id}`} className="block">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-brand-500/50 transition cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                  <span className="text-brand-500 font-bold text-sm">
                    {c.first_name?.[0]}{c.last_name?.[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{c.first_name} {c.last_name}</p>
                  <p className="text-gray-500 text-xs">{c.email}</p>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "text-green-400 bg-green-400/10" : "text-gray-400 bg-gray-400/10"}`}>
                  {c.status || "active"}
                </span>
                {c.fitness_level && (
                  <span className="text-xs text-gray-500">{c.fitness_level}</span>
                )}
                {c.weight_kg && (
                  <span className="text-xs text-gray-500">{c.weight_kg} kg</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">No clients yet. Invite or search to add clients.</p>
        </div>
      )}
    </div>
  );
}
