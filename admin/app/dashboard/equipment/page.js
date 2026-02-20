"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api("/equipment?limit=100")
      .then((data) => {
        setEquipment(data.data || []);
        setTotal(data.pagination?.total || 0);
      })
      .catch(() => {});
  }, []);

  const categoryColors = {
    machine: "bg-blue-400/10 text-blue-400",
    free_weight: "bg-purple-400/10 text-purple-400",
    cable: "bg-green-400/10 text-green-400",
    bodyweight: "bg-yellow-400/10 text-yellow-400",
    cardio: "bg-red-400/10 text-red-400",
    other: "bg-gray-400/10 text-gray-400",
  };

  return (
    <div>
      <h1 className="text-white text-2xl font-bold mb-6">Equipment Library ({total})</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <div key={item.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold">{item.name}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${categoryColors[item.category] || ""}`}>
                {item.category.replace("_", " ")}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              {item.brand && <p className="text-gray-400">Brand: <span className="text-gray-300">{item.brand}</span></p>}
              {item.model && <p className="text-gray-400">Model: <span className="text-gray-300">{item.model}</span></p>}
              {item.gym_location && <p className="text-gray-400">Location: <span className="text-gray-300">{item.gym_location}</span></p>}
              {item.notes && <p className="text-gray-500 text-xs mt-2">{item.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No equipment added yet</p>
        </div>
      )}
    </div>
  );
}
