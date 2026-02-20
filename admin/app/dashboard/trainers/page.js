"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function TrainersPage() {
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    api("/admin/users?role=trainer&limit=100")
      .then((data) => setTrainers(data.data || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Trainers ({trainers.length})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainers.map((trainer) => (
          <div key={trainer.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <span className="text-blue-400 font-bold text-lg">{trainer.first_name?.[0]}{trainer.last_name?.[0]}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{trainer.first_name} {trainer.last_name}</h3>
                <p className="text-gray-500 text-xs">{trainer.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                trainer.status === "active" ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
              }`}>
                {trainer.status}
              </span>
              <span className="text-gray-500 text-xs">ID: {trainer.id}</span>
            </div>
          </div>
        ))}
      </div>

      {trainers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No trainers registered yet</p>
        </div>
      )}
    </div>
  );
}
