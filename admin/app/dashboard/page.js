"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import StatCard from "../../components/StatCard";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([
      api("/admin/users?limit=1").catch(() => ({ pagination: { total: 0 } })),
      api("/admin/users?role=trainer&limit=1").catch(() => ({ pagination: { total: 0 } })),
      api("/equipment?limit=1").catch(() => ({ pagination: { total: 0 } })),
      api("/nutrition/foods?limit=1").catch(() => ({ pagination: { total: 0 } })),
    ]).then(([users, trainers, equip, foods]) => {
      setStats({
        totalUsers: users.pagination?.total || users.data?.length || 0,
        totalTrainers: trainers.pagination?.total || trainers.data?.length || 0,
        totalEquipment: equip.pagination?.total || equip.data?.length || 0,
        totalFoods: foods.pagination?.total || foods.data?.length || 0,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Dashboard</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="blue" />
          <StatCard title="Trainers" value={stats.totalTrainers} icon="🏋️" color="green" />
          <StatCard title="Equipment" value={stats.totalEquipment} icon="⚙️" color="purple" />
          <StatCard title="Food Items" value={stats.totalFoods} icon="🍎" color="yellow" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">API Server</span>
              <span className="text-green-400 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full" /> Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Database</span>
              <span className="text-green-400 text-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Hosting</span>
              <span className="text-blue-400 text-sm">DigitalOcean</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-white font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/dashboard/users" className="block px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 text-sm">
              Manage Users →
            </Link>
            <Link href="/dashboard/foods" className="block px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 text-sm">
              Manage Food Database →
            </Link>
            <Link href="/dashboard/features" className="block px-4 py-3 bg-gray-900 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 text-sm">
              Feature Flags →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
