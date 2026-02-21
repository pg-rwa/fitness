"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/AuthProvider";
import { api } from "../../../lib/api";

export default function ClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => {
    // Load clients (users where trainer_id = me)
    api("/admin/users?limit=100")
      .then((d) => {
        const all = d.data || [];
        setClients(all.filter((u) => u.trainer_id === user?.id && u.role === "client"));
      })
      .catch(() => {
        // Fallback: trainer might not have admin access, try users endpoint
      });

    api("/auth/invitations")
      .then((d) => setInvitations(d.invitations || d.data || []))
      .catch(() => {});
  }, [user]);

  const sendInvite = async () => {
    try {
      const data = await api("/auth/invitations", {
        method: "POST",
        body: { email: inviteEmail, role: "client" },
      });
      setInviteResult(data);
      setInviteEmail("");
      const d = await api("/auth/invitations");
      setInvitations(d.invitations || d.data || []);
    } catch {}
  };

  const revokeInvite = async (id) => {
    try {
      await api(`/auth/invitations/${id}`, { method: "DELETE" });
      const d = await api("/auth/invitations");
      setInvitations(d.invitations || d.data || []);
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Clients</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          Invite Client
        </button>
      </div>

      {showInvite && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h3 className="text-white font-semibold text-sm mb-3">Send Invitation</h3>
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
          {inviteResult && (
            <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              <p className="text-green-400 text-sm">Invitation sent!</p>
              {inviteResult.invitation?.token && (
                <p className="text-gray-400 text-xs mt-1">
                  Registration link: {typeof window !== "undefined" ? window.location.origin : ""}/register?token={inviteResult.invitation.token}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {invitations.length > 0 && (
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

      <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Active Clients</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {clients.map((c) => (
          <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-500/20 rounded-full flex items-center justify-center">
                <span className="text-brand-500 font-bold text-sm">
                  {c.first_name?.[0]}{c.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">{c.first_name} {c.last_name}</p>
                <p className="text-gray-500 text-xs">{c.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "active" ? "text-green-400 bg-green-400/10" : "text-gray-400 bg-gray-400/10"}`}>
                {c.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600 text-sm">No clients yet. Send an invitation to get started.</p>
        </div>
      )}
    </div>
  );
}
