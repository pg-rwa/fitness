"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function FoodsPage() {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const loadFoods = async () => {
    try {
      const data = await api(`/nutrition/foods${search ? `?q=${encodeURIComponent(search)}` : "?limit=50"}`);
      setFoods(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {}
  };

  useEffect(() => { loadFoods(); }, [search]);

  const toggleVerified = async (id, current) => {
    try {
      await api(`/nutrition/foods/${id}`, { method: "PUT", body: { isVerified: !current } });
      await loadFoods();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-white text-2xl font-bold">Food Database ({total})</h1>
        <input
          type="text"
          placeholder="Search foods..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:border-primary focus:outline-none w-64"
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Food</th>
              <th className="text-left text-gray-400 text-xs font-medium px-6 py-3">Serving</th>
              <th className="text-right text-gray-400 text-xs font-medium px-6 py-3">Cal</th>
              <th className="text-right text-gray-400 text-xs font-medium px-6 py-3">Protein</th>
              <th className="text-right text-gray-400 text-xs font-medium px-6 py-3">Carbs</th>
              <th className="text-right text-gray-400 text-xs font-medium px-6 py-3">Fat</th>
              <th className="text-center text-gray-400 text-xs font-medium px-6 py-3">Verified</th>
            </tr>
          </thead>
          <tbody>
            {foods.map((food) => (
              <tr key={food.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="px-6 py-3">
                  <div className="text-white text-sm font-medium">{food.name}</div>
                  {food.brand && <div className="text-gray-500 text-xs">{food.brand}</div>}
                </td>
                <td className="px-6 py-3 text-gray-300 text-sm">{food.serving_size}{food.serving_unit}</td>
                <td className="px-6 py-3 text-white text-sm text-right font-medium">{food.calories}</td>
                <td className="px-6 py-3 text-green-400 text-sm text-right">{food.protein_g}g</td>
                <td className="px-6 py-3 text-blue-400 text-sm text-right">{food.carbs_g}g</td>
                <td className="px-6 py-3 text-yellow-400 text-sm text-right">{food.fat_g}g</td>
                <td className="px-6 py-3 text-center">
                  <button
                    onClick={() => toggleVerified(food.id, food.is_verified)}
                    className={`text-xs px-2 py-1 rounded ${food.is_verified ? "bg-green-400/10 text-green-400" : "bg-gray-600/30 text-gray-500"}`}
                  >
                    {food.is_verified ? "✓ Verified" : "Unverified"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
