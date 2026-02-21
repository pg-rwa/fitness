"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{current} / {target}{label === "Calories" ? "" : "g"}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LogMealModal({ onClose, onSave }) {
  const [mealType, setMealType] = useState("lunch");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (query.length >= 2) {
      const t = setTimeout(() => {
        api(`/nutrition/foods?q=${encodeURIComponent(query)}`).then((d) => setFoods(d.data || [])).catch(() => {});
      }, 300);
      return () => clearTimeout(t);
    }
  }, [query]);

  const addItem = (food) => {
    setItems((prev) => [...prev, { ...food, quantity: 1, unit: food.serving_unit || "serving" }]);
    setQuery("");
    setFoods([]);
  };

  const updateQty = (i, qty) => {
    setItems((prev) => prev.map((item, j) => j === i ? { ...item, quantity: parseFloat(qty) || 0 } : item));
  };

  const removeItem = (i) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
  };

  const save = async () => {
    try {
      await api("/nutrition/meals", {
        method: "POST",
        body: {
          mealType,
          items: items.map((i) => ({
            foodItemId: i.id,
            quantity: i.quantity,
            unit: i.unit,
          })),
        },
      });
      onSave();
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-white font-bold mb-4">Log Meal</h2>

        <div className="mb-3">
          <div className="flex gap-2">
            {["breakfast", "lunch", "dinner", "snack"].map((t) => (
              <button
                key={t}
                onClick={() => setMealType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs capitalize ${mealType === t ? "bg-brand-500 text-white" : "bg-gray-800 text-gray-400"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-brand-500 focus:outline-none"
          />
          {foods.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-lg mt-1 max-h-40 overflow-y-auto z-10">
              {foods.map((f) => (
                <button key={f.id} onClick={() => addItem(f)} className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm">
                  <span className="text-white">{f.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{f.calories}cal &middot; {f.serving_size}{f.serving_unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="space-y-2 mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.name}</p>
                  <p className="text-gray-500 text-xs">{Math.round(item.calories * item.quantity)}cal</p>
                </div>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateQty(i, e.target.value)}
                  className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white text-xs text-center"
                  min="0.1"
                  step="0.5"
                />
                <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 text-xs">X</button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-sm">Cancel</button>
          <button onClick={save} disabled={items.length === 0} className="flex-1 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            Save Meal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({});
  const [showLog, setShowLog] = useState(false);

  const load = () => {
    api(`/nutrition/meals?date=${date}`).then((d) => setMeals(d.data || d.meals || [])).catch(() => {});
    api(`/nutrition/summary?date=${date}`).then((d) => setSummary(d)).catch(() => setSummary({}));
  };

  useEffect(() => { load(); }, [date]);

  const targets = { calories: 2200, protein: 150, carbs: 250, fat: 70 };

  const deleteMeal = async (id) => {
    try {
      await api(`/nutrition/meals/${id}`, { method: "DELETE" });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Nutrition</h1>
        <button
          onClick={() => setShowLog(true)}
          className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600"
        >
          Log Meal
        </button>
      </div>

      {showLog && <LogMealModal onClose={() => setShowLog(false)} onSave={() => { setShowLog(false); load(); }} />}

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
        />
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
        <MacroBar label="Calories" current={summary.totalCalories || 0} target={targets.calories} color="bg-brand-500" />
        <MacroBar label="Protein" current={summary.totalProtein || 0} target={targets.protein} color="bg-green-500" />
        <MacroBar label="Carbs" current={summary.totalCarbs || 0} target={targets.carbs} color="bg-blue-500" />
        <MacroBar label="Fat" current={summary.totalFat || 0} target={targets.fat} color="bg-yellow-500" />
      </div>

      <div className="space-y-2">
        {["breakfast", "lunch", "dinner", "snack"].map((type) => {
          const typeMeals = meals.filter((m) => m.meal_type === type);
          if (typeMeals.length === 0) return null;
          return (
            <div key={type}>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 mt-3">{type}</h3>
              {typeMeals.map((m) => (
                <div key={m.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 mb-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      {(m.items || []).map((item, i) => (
                        <p key={i} className="text-white text-sm">{item.food_name || item.name} <span className="text-gray-500">x{item.quantity}</span></p>
                      ))}
                      {(m.items || []).length === 0 && <p className="text-gray-500 text-sm">Meal logged</p>}
                    </div>
                    <button onClick={() => deleteMeal(m.id)} className="text-gray-600 hover:text-red-400 text-xs">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {meals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">No meals logged for this day</p>
          </div>
        )}
      </div>
    </div>
  );
}
