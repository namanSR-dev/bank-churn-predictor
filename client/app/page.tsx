"use client"; // ENGR NOTE: Establishes a Client Boundary. Required since we manage local React state and user events.

import { useState } from "react";

// ENGR NOTE: Defining the strict TypeScript interface for our prediction payload prevents runtime type errors.
interface PredictionResult {
  churn_probability: number;
  is_flight_risk: boolean;
  threshold_applied: number;
}

export default function Dashboard() {
  // ENGR NOTE: Centralized state management for all model features.
  // Default values represent a 'safe' baseline customer profile.
  const [formData, setFormData] = useState({
    CreditScore: 650,
    Age: 40,
    Balance: 50000,
    NumOfProducts: 2,
    IsActiveMember: 1,
    Geography_Germany: 0,
    Geography_Spain: 0,
    Gender_Male: 1,
  });

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  // ENGR NOTE: Universal handler for all inputs to keep the codebase DRY (Don't Repeat Yourself).
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // ENGR NOTE: Async fetch wrapper to communicate with our Python XGBoost microservice.
  const analyzeRisk = async () => {
    setLoading(true);
    try {
      const response = await fetch("https://bank-churn-api-2skp.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("API Gateway Error:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-8 font-sans text-slate-800">
      
      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-neutral-900 tracking-tight mb-2">
          AI Customer Churn Predictor
        </h1>
        <p className="text-lg text-slate-500 font-medium">
          Real-time XGBoost Inference Engine
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANE: Interactive Model Inputs */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Customer Profile Parameters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Range Slider + Number Input Component (Credit Score) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 flex justify-between">
                <span>Credit Score</span>
                <input 
                  type="number" 
                  name="CreditScore" 
                  value={formData.CreditScore} 
                  onChange={handleChange}
                  className="w-20 text-right border rounded px-2 py-1 text-sm bg-slate-50"
                />
              </label>
              <input 
                type="range" min="300" max="850" name="CreditScore" 
                value={formData.CreditScore} onChange={handleChange} 
                className="w-full accent-green-700"
              />
            </div>

            {/* Range Slider + Number Input Component (Age) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 flex justify-between">
                <span>Age</span>
                <input 
                  type="number" name="Age" value={formData.Age} onChange={handleChange}
                  className="w-20 text-right border rounded px-2 py-1 text-sm bg-slate-50"
                />
              </label>
              <input 
                type="range" min="18" max="100" name="Age" 
                value={formData.Age} onChange={handleChange} 
                className="w-full accent-green-700"
              />
            </div>

            {/* Range Slider + Number Input Component (Balance) */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600 flex justify-between">
                <span>Account Balance ($)</span>
                <input 
                  type="number" name="Balance" value={formData.Balance} onChange={handleChange}
                  className="w-32 text-right border rounded px-2 py-1 text-sm bg-slate-50"
                />
              </label>
              <input 
                type="range" min="0" max="250000" step="1000" name="Balance" 
                value={formData.Balance} onChange={handleChange} 
                className="w-full accent-green-700"
              />
            </div>

            {/* Categorical Selectors */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 block">Number of Products</label>
              <select name="NumOfProducts" value={formData.NumOfProducts} onChange={handleChange} className="w-full border rounded-lg p-2.5 bg-slate-50">
                <option value={1}>1 Product</option>
                <option value={2}>2 Products</option>
                <option value={3}>3 Products</option>
                <option value={4}>4 Products</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 block">Active Member Status</label>
              <select name="IsActiveMember" value={formData.IsActiveMember} onChange={handleChange} className="w-full border rounded-lg p-2.5 bg-slate-50">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>

            {/* ENGR NOTE: We map standard categorical dropdowns directly to our one-hot encoded backend variables */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 block">Geography</label>
              <select 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    Geography_Germany: val === "Germany" ? 1 : 0,
                    Geography_Spain: val === "Spain" ? 1 : 0
                  }));
                }} 
                className="w-full border rounded-lg p-2.5 bg-slate-50"
              >
                <option value="France">France (Default)</option>
                <option value="Germany">Germany</option>
                <option value="Spain">Spain</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 block">Gender</label>
              <select name="Gender_Male" value={formData.Gender_Male} onChange={handleChange} className="w-full border rounded-lg p-2.5 bg-slate-50">
                <option value={1}>Male</option>
                <option value={0}>Female</option>
              </select>
            </div>
          </div>

          <button 
            onClick={analyzeRisk}
            disabled={loading}
            className="mt-8 w-full bg-green-700 hover:bg-green-900 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.99] disabled:opacity-70"
          >
            {loading ? "Running AI Inference..." : "Execute Risk Analysis"}
          </button>
        </div>

        {/* RIGHT PANE: Results & Model Documentation */}
        <div className="space-y-6">
          {/* Output Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center min-h-[250px] flex flex-col justify-center">
            {result ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Churn Probability</h3>
                <p className="text-6xl font-black mb-4 text-slate-800">
                  {(result.churn_probability * 100).toFixed(1)}%
                </p>
                <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-sm ${result.is_flight_risk ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {result.is_flight_risk ? "🚨 CRITICAL FLIGHT RISK" : "✅ RETENTION STABLE"}
                </div>
              </div>
            ) : (
              <div className="text-slate-400">
                <p className="font-semibold mb-2">Awaiting Data</p>
                <p className="text-sm">Adjust parameters and execute analysis to view model inference.</p>
              </div>
            )}
          </div>

          {/* Model Workflow Documentation */}
          <div className="bg-slate-800 rounded-2xl shadow-sm p-8 text-slate-300">
            <h3 className="text-lg font-bold text-white mb-4">Pipeline Architecture</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">1.</span>
                <p><strong>Payload:</strong> The React client sends the 8 parameters via REST to the FastAPI backend.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">2.</span>
                <p><strong>Preprocessing:</strong> A serialized <code className="bg-slate-700 px-1 rounded text-green-300">RobustScaler</code> standardizes the input array to prevent distance distortion.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">3.</span>
                <p><strong>Inference:</strong> The XGBoost ensemble model scores the scaled data against historical churn patterns.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-green-700 font-bold">4.</span>
                <p><strong>Threshold Logic:</strong> Applies our custom-tuned F1-optimized threshold (0.5877) to determine the final Boolean flag.</p>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}