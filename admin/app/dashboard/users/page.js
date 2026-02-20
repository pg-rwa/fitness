"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      const data = await api(`/admin/users?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`);
      setUsers(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {}
  };

  useEffect(() => { loadUsers(); }, [page, search]);

  const updateRole = async (userId, role) => {
    try {
      await api(`/admin/users/${userId}/role`, { method: "PUT", body: { role } });
      await loadUsers();
    } catch {}
  };

  const updateStatus = async (userId, status) => {
    try {
      await api(`/admin/users/${userId}/status`, { method: "PUT", body: { status } });
      await loadUsers();
    } catch {}
  };

  const statusColors = { active: "text-green-400 bg-green-400/10", invited: "text-yellow-400 bg-yellow-400/10", suspended: "text-red-400 bg-red-400/10" };
  const roleColors = { admin: "text-purple-400 bg-purple-400/10", trainer: "text-blue-400 bg-blue-400/10", client: "text-gray-400 bg-gray-400/10" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Users ({total})</h1>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none w-64"
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">User</th>
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Email</th>
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Role</th>
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Status</th>
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-4">
                  <div className="text-white font-medium text-sm">{user.first_name} {user.last_name}</div>
                  <div className="text-gray-500 text-xs">ID: {user.id}</div>
                </td>
                <td className="px-6 py-4 text-gray-300 text-sm">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${roleColors[user.role] || ""}`}
                  >
                    <option value="client">Client</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[user.status] || ""}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.status === "active" ? (
                    <button onClick={() => updateStatus(user.id, "suspended")} className="text-red-400 text-xs hover:underline">Suspend</button>
                  ) : (
                    <button onClick={() => updateStatus(user.id, "active")} className="text-green-400 text-xs hover:underline">Activate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-400 disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-gray-400 text-sm">Page {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={users.length < 20} className="px-3 py-1 bg-gray-800 rounded text-sm text-gray-400 disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
