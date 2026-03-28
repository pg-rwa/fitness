"use client";
import { useEffect, useState, useRef } from "react";
import { api, apiUpload } from "../../../lib/api";

/* ─── Icons ─── */
function SvgIcon({ d, className = "w-5 h-5", strokeWidth = 1.5 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const IC = {
  camera: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z",
  barcode: "M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z",
  sparkles: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  close: "M6 18L18 6M6 6l12 12",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
};

function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300">{Math.round(current)} / {target}{label === "Calories" ? "" : "g"}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── AI Photo Analysis Modal ─── */
function PhotoAnalysisModal({ onClose, onAddItems }) {
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError("");
    setResult(null);
  };

  const analyze = async () => {
    if (!photo) return;
    setAnalyzing(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("photo", photo);
      const data = await apiUpload("/nutrition/analyze-photo", formData);
      setResult(data);
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const addAllItems = () => {
    if (result?.items) {
      onAddItems(result.items);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <SvgIcon d={IC.sparkles} className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">AI Meal Analysis</h2>
              <p className="text-gray-500 text-[10px]">Take a photo to identify nutrients</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <SvgIcon d={IC.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Upload area */}
          {!preview ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500/50 transition group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-500/10 transition">
                <SvgIcon d={IC.camera} className="w-7 h-7 text-gray-500 group-hover:text-brand-400 transition" />
              </div>
              <p className="text-gray-400 text-sm font-medium">Take or upload a photo</p>
              <p className="text-gray-600 text-xs mt-1">JPEG, PNG, WebP (max 5MB)</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                capture="environment"
                onChange={handleFile}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="Meal" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setPhoto(null); setPreview(null); setResult(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition"
                >
                  <SvgIcon d={IC.close} className="w-4 h-4" />
                </button>
              </div>

              {/* Analyze button */}
              {!result && !analyzing && (
                <button
                  onClick={analyze}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-500 to-purple-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:from-brand-600 hover:to-purple-600 transition"
                >
                  <SvgIcon d={IC.sparkles} className="w-4 h-4" strokeWidth={2} />
                  Analyze with AI
                </button>
              )}

              {/* Loading */}
              {analyzing && (
                <div className="flex items-center justify-center py-6 gap-3">
                  <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400 text-sm">Analyzing your meal...</span>
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-semibold">{result.meal_name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        result.confidence === "high" ? "bg-green-500/20 text-green-400" :
                        result.confidence === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {result.confidence} confidence
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-brand-400 text-lg font-bold">{Math.round(result.total_calories)}</p>
                      <p className="text-gray-500 text-[10px]">total cal</p>
                    </div>
                  </div>

                  {/* Macro summary */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-500/10 rounded-lg p-2 text-center">
                      <p className="text-green-400 text-sm font-bold">{Math.round(result.total_protein_g)}g</p>
                      <p className="text-gray-500 text-[10px]">Protein</p>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                      <p className="text-blue-400 text-sm font-bold">{Math.round(result.total_carbs_g)}g</p>
                      <p className="text-gray-500 text-[10px]">Carbs</p>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                      <p className="text-yellow-400 text-sm font-bold">{Math.round(result.total_fat_g)}g</p>
                      <p className="text-gray-500 text-[10px]">Fat</p>
                    </div>
                  </div>

                  {/* Individual items */}
                  <div className="space-y-1.5">
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Identified Items</p>
                    {result.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-800/50 rounded-lg px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{item.name}</p>
                          <p className="text-gray-500 text-[10px]">{item.estimated_portion} | {Math.round(item.calories)} cal</p>
                        </div>
                        <div className="text-right text-[10px] text-gray-500">
                          <span className="text-green-400">{item.protein_g}p</span>{" "}
                          <span className="text-blue-400">{item.carbs_g}c</span>{" "}
                          <span className="text-yellow-400">{item.fat_g}f</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {result.tips && (
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3">
                      <p className="text-brand-400 text-xs"><span className="font-semibold">Tip:</span> {result.tips}</p>
                    </div>
                  )}

                  <button
                    onClick={addAllItems}
                    className="w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
                  >
                    <SvgIcon d={IC.check} className="w-4 h-4" strokeWidth={2} />
                    Add to Meal Log
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Barcode Scanner Modal ─── */
function BarcodeScannerModal({ onClose, onAddItem }) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const lookup = async () => {
    if (!barcode.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await api(`/nutrition/barcode/${encodeURIComponent(barcode.trim())}`);
      setResult(data.item);
    } catch (err) {
      setError(err.message || "Product not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <SvgIcon d={IC.barcode} className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">Barcode Lookup</h2>
              <p className="text-gray-500 text-[10px]">Enter barcode to find nutrition info</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <SvgIcon d={IC.close} className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
              placeholder="Enter barcode number..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:border-blue-500 focus:outline-none"
              autoFocus
            />
            <button
              onClick={lookup}
              disabled={loading || !barcode.trim()}
              className="px-4 py-2.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Search"
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                {result.photo_url && (
                  <img src={result.photo_url} alt={result.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">{result.name}</p>
                  {result.brand && <p className="text-gray-500 text-xs">{result.brand}</p>}
                  <p className="text-gray-400 text-xs mt-1">Per {result.serving_size}{result.serving_unit}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="bg-brand-500/10 rounded-lg p-2 text-center">
                  <p className="text-brand-400 text-sm font-bold">{result.calories}</p>
                  <p className="text-gray-500 text-[10px]">Cal</p>
                </div>
                <div className="bg-green-500/10 rounded-lg p-2 text-center">
                  <p className="text-green-400 text-sm font-bold">{result.protein_g}g</p>
                  <p className="text-gray-500 text-[10px]">Protein</p>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-2 text-center">
                  <p className="text-blue-400 text-sm font-bold">{result.carbs_g}g</p>
                  <p className="text-gray-500 text-[10px]">Carbs</p>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-2 text-center">
                  <p className="text-yellow-400 text-sm font-bold">{result.fat_g}g</p>
                  <p className="text-gray-500 text-[10px]">Fat</p>
                </div>
              </div>

              <button
                onClick={() => onAddItem(result)}
                className="w-full py-2.5 bg-green-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
              >
                <SvgIcon d={IC.plus} className="w-4 h-4" strokeWidth={2} />
                Add to Meal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Log Meal Modal ─── */
function LogMealModal({ onClose, onSave }) {
  const [mealType, setMealType] = useState("lunch");
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState([]);
  const [items, setItems] = useState([]);
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const t = setTimeout(() => {
        api(`/nutrition/foods?q=${encodeURIComponent(query)}`).then((d) => setFoods(d.data || [])).catch(() => {});
      }, 300);
      return () => clearTimeout(t);
    } else {
      setFoods([]);
    }
  }, [query]);

  const addItem = (food) => {
    setItems((prev) => [...prev, { ...food, quantity: 1, unit: food.serving_unit || "serving" }]);
    setQuery("");
    setFoods([]);
  };

  const addAiItems = (aiItems) => {
    const newItems = aiItems.map((item) => ({
      name: item.name,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      serving_size: item.serving_size || 100,
      serving_unit: item.serving_unit || "g",
      quantity: 1,
      unit: item.serving_unit || "g",
      isAiGenerated: true,
    }));
    setItems((prev) => [...prev, ...newItems]);
    setShowPhotoAnalysis(false);
  };

  const updateQty = (i, qty) => {
    setItems((prev) => prev.map((item, j) => j === i ? { ...item, quantity: parseFloat(qty) || 0 } : item));
  };

  const removeItem = (i) => {
    setItems((prev) => prev.filter((_, j) => j !== i));
  };

  const save = async () => {
    try {
      // Separate AI-generated items (need to be created first) and existing items
      const aiItems = items.filter(i => i.isAiGenerated);
      const existingItems = items.filter(i => !i.isAiGenerated);

      const finalItems = [...existingItems.map(i => ({ foodItemId: i.id, quantity: i.quantity, unit: i.unit }))];

      // Create AI-generated items as custom foods first
      for (const item of aiItems) {
        try {
          const created = await api("/nutrition/foods", {
            method: "POST",
            body: {
              name: item.name,
              calories: item.calories,
              proteinG: item.protein_g,
              carbsG: item.carbs_g,
              fatG: item.fat_g,
              servingSize: item.serving_size,
              servingUnit: item.serving_unit,
            },
          });
          finalItems.push({ foodItemId: created.id, quantity: item.quantity, unit: item.unit });
        } catch {
          // Skip items that fail to create
        }
      }

      if (finalItems.length > 0) {
        await api("/nutrition/meals", {
          method: "POST",
          body: { mealType, items: finalItems },
        });
      }
      onSave();
    } catch {}
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-white font-bold">Log Meal</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white">
              <SvgIcon d={IC.close} className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Meal type */}
            <div className="flex gap-2">
              {["breakfast", "lunch", "dinner", "snack"].map((t) => (
                <button
                  key={t}
                  onClick={() => setMealType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs capitalize transition ${mealType === t ? "bg-brand-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* AI-powered input options */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowPhotoAnalysis(true)}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 rounded-xl hover:border-brand-500/40 transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center shrink-0 group-hover:bg-brand-500/30 transition">
                  <SvgIcon d={IC.camera} className="w-4.5 h-4.5 text-brand-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-semibold">Scan Food</p>
                  <p className="text-gray-500 text-[10px]">AI photo analysis</p>
                </div>
              </button>
              <button
                onClick={() => setShowBarcode(true)}
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition">
                  <SvgIcon d={IC.barcode} className="w-4.5 h-4.5 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-white text-xs font-semibold">Barcode</p>
                  <p className="text-gray-500 text-[10px]">Scan product</p>
                </div>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <SvgIcon d={IC.search} className="w-4 h-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:border-brand-500 focus:outline-none"
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

            {/* Selected items */}
            {items.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Selected Items</p>
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-white text-sm truncate">{item.name}</p>
                        {item.isAiGenerated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-medium shrink-0">AI</span>
                        )}
                      </div>
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
                    <button onClick={() => removeItem(i)} className="text-gray-500 hover:text-red-400 text-xs font-bold">X</button>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 transition">Cancel</button>
              <button onClick={save} disabled={items.length === 0} className="flex-1 px-4 py-2.5 bg-brand-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-brand-600 transition">
                Save Meal
              </button>
            </div>
          </div>
        </div>
      </div>

      {showPhotoAnalysis && (
        <PhotoAnalysisModal
          onClose={() => setShowPhotoAnalysis(false)}
          onAddItems={addAiItems}
        />
      )}
      {showBarcode && (
        <BarcodeScannerModal
          onClose={() => setShowBarcode(false)}
          onAddItem={(item) => { addItem(item); setShowBarcode(false); }}
        />
      )}
    </>
  );
}

/* ═══ Nutrition Page ═══ */
export default function NutritionPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [meals, setMeals] = useState([]);
  const [summary, setSummary] = useState({});
  const [showLog, setShowLog] = useState(false);

  const load = () => {
    api(`/nutrition/meals?date=${date}`).then((d) => setMeals(Array.isArray(d) ? d : d.data || d.meals || [])).catch(() => {});
    api(`/nutrition/summary?date=${date}`).then((d) => setSummary({
      totalCalories: d.total_calories || d.totalCalories || 0,
      totalProtein: d.total_protein_g || d.totalProtein || 0,
      totalCarbs: d.total_carbs_g || d.totalCarbs || 0,
      totalFat: d.total_fat_g || d.totalFat || 0,
    })).catch(() => setSummary({}));
  };

  useEffect(() => { load(); }, [date]);

  const targets = { calories: 2200, protein: 150, carbs: 250, fat: 70 };

  const deleteMeal = async (id) => {
    try {
      await api(`/nutrition/meals/${id}`, { method: "DELETE" });
      load();
    } catch {}
  };

  const isToday = date === new Date().toISOString().split("T")[0];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white text-xl font-bold">Nutrition</h1>
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition"
        >
          <SvgIcon d={IC.plus} className="w-4 h-4" strokeWidth={2} />
          Log Meal
        </button>
      </div>

      {showLog && <LogMealModal onClose={() => setShowLog(false)} onSave={() => { setShowLog(false); load(); }} />}

      {/* Date nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none"
          />
          {isToday && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-medium">Today</span>}
        </div>
        <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().split("T")[0]); }} className="text-gray-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Macro bars */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 space-y-3">
        <MacroBar label="Calories" current={summary.totalCalories || 0} target={targets.calories} color="bg-brand-500" />
        <MacroBar label="Protein" current={summary.totalProtein || 0} target={targets.protein} color="bg-green-500" />
        <MacroBar label="Carbs" current={summary.totalCarbs || 0} target={targets.carbs} color="bg-blue-500" />
        <MacroBar label="Fat" current={summary.totalFat || 0} target={targets.fat} color="bg-yellow-500" />
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-2 p-3 bg-gradient-to-r from-brand-500/10 to-purple-500/10 border border-brand-500/20 rounded-xl hover:border-brand-500/40 transition"
        >
          <SvgIcon d={IC.camera} className="w-5 h-5 text-brand-400" />
          <div className="text-left">
            <p className="text-white text-xs font-semibold">AI Scan</p>
            <p className="text-gray-500 text-[10px]">Photo analysis</p>
          </div>
        </button>
        <button
          onClick={() => setShowLog(true)}
          className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl hover:border-blue-500/40 transition"
        >
          <SvgIcon d={IC.barcode} className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <p className="text-white text-xs font-semibold">Barcode</p>
            <p className="text-gray-500 text-[10px]">Scan product</p>
          </div>
        </button>
      </div>

      {/* Meals list */}
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
                    <div className="flex-1 min-w-0">
                      {(m.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between mb-0.5">
                          <p className="text-white text-sm truncate">{item.food_name || item.name} <span className="text-gray-500">x{item.quantity}</span></p>
                          <span className="text-gray-500 text-xs ml-2 shrink-0">{Math.round(item.calories)}cal</span>
                        </div>
                      ))}
                      {(m.items || []).length === 0 && <p className="text-gray-500 text-sm">Meal logged</p>}
                    </div>
                    <button onClick={() => deleteMeal(m.id)} className="text-gray-600 hover:text-red-400 text-xs ml-3 shrink-0">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
        {meals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm">No meals logged for this day</p>
            <button onClick={() => setShowLog(true)} className="mt-3 text-brand-500 text-sm font-medium hover:text-brand-400 transition">
              Log your first meal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
