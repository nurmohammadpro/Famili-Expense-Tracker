import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

// Analytics Component for spending distribution
const ExpenseChart = ({ data, categories }) => {
  const chartData = categories
    .map((cat) => ({
      name: cat.name,
      value: parseFloat(data[cat.id] || 0),
    }))
    .filter((item) => item.value > 0);

  const COLORS = [
    "oklch(44.6% 0.043 257.281)", // primary-light
    "oklch(72.3% 0.219 149.579)", // success
    "oklch(63.7% 0.237 25.331)", // error
    "oklch(27.9% 0.041 260.031)", // primary-dark
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  if (chartData.length === 0) return null;

  return (
    <section className="card">
      <h2 className="text-xl font-bold mb-4">Spending Distribution</h2>
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                fontFamily: "Satoshi",
              }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

const App = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [inputValues, setInputValues] = useState({});
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const formatDate = (date) => date.toISOString().split("T")[0];
  const todayString = formatDate(currentDate);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("id");
      if (error) throw error;
      setCategories(data);
    } catch (err) {
      setError("Failed to load categories");
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select(`*, expense_categories!fk_expense_categories (name, icon)`)
        .eq("date", todayString);

      if (error) throw error;
      const inputData = {};
      if (data)
        data.forEach((exp) => (inputData[exp.category_id] = exp.amount));
      setInputValues(inputData);
      setExpenses(data);
    } catch (err) {
      setError("Failed to load today's data.");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = async () => {
    try {
      const start = formatDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      );
      const end = formatDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0),
      );
      const { data } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", start)
        .lte("date", end);
      const total =
        data?.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0) || 0;
      setMonthlyTotal(total);
    } catch (err) {
      console.error(err);
    }
  };

  const saveExpenses = async () => {
    try {
      setSaving(true);
      setError("");
      const toInsert = categories
        .filter(
          (cat) => inputValues[cat.id] && parseFloat(inputValues[cat.id]) > 0,
        )
        .map((cat) => ({
          date: todayString,
          category_id: cat.id,
          amount: parseFloat(inputValues[cat.id]).toFixed(2),
          description: `${cat.name} expense`,
        }));

      if (toInsert.length === 0) return setError("Please enter an amount.");

      await supabase.from("expenses").delete().eq("date", todayString);
      const { error: insErr } = await supabase
        .from("expenses")
        .insert(toInsert);
      if (insErr) throw insErr;

      await loadExpenses();
      await calculateMonthlyTotal();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    if (categories.length > 0) {
      loadExpenses();
      calculateMonthlyTotal();
    }
  }, [todayString, categories.length]);

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("expense_categories")
        .insert([{ name: newCategoryName, icon: "📁" }]);
      if (error) throw error;
      setNewCategoryName("");
      await loadCategories();
    } catch (err) {
      setError("Failed to add category");
    } finally {
      setSaving(false);
    }
  };

  const navigateDate = (days) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + days);
    setCurrentDate(next);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary-light font-display">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light" />
      </div>
    );

  return (
    <div className="min-h-screen bg-secondary-light p-4 md:p-8 font-display text-primary-dark">
      {showSuccess && (
        <div className="fixed top-6 right-6 z-50">
          <div className="bg-success text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
            <span>✅</span>{" "}
            <span className="font-medium">Synced Successfully</span>
          </div>
        </div>
      )}

      <div className="container-wide space-y-8">
        {/* Header Section - Removed interactive-lift */}
        <header className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Expense Tracker
            </h1>
            <p className="text-primary-light font-medium">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => navigateDate(-1)}
                className="btn btn-secondary btn-sm"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="btn btn-outline btn-sm"
              >
                Today
              </button>
              <button
                onClick={() => navigateDate(1)}
                className="btn btn-secondary btn-sm"
              >
                →
              </button>
            </div>
          </div>
          <div className="card-primary p-6 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-70">
                Monthly Total
              </p>
              <p className="text-4xl font-black text-primary-dark">
                {monthlyTotal.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest font-bold opacity-70">
                Today
              </p>
              <p className="text-2xl font-bold text-success">
                {Object.values(inputValues)
                  .reduce((a, b) => a + (parseFloat(b) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        {/* Analytics Section */}
        <ExpenseChart data={inputValues} categories={categories} />

        {/* Form Section - Removed animate-slide-up */}
        <section className="card">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            📝 Log Expenses
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveExpenses();
            }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-2">
                    {cat.icon} {cat.name}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-sm"></span>
                    <input
                      type="number"
                      value={inputValues[cat.id] || ""}
                      onChange={(e) =>
                        setInputValues({
                          ...inputValues,
                          [cat.id]: e.target.value,
                        })
                      }
                      className="input-base pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-secondary-dark">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-lg w-full md:w-auto"
              >
                {saving ? "Processing..." : "Save Today's Data"}
              </button>
            </div>
          </form>
        </section>

        {/* Category Management */}
        <section className="card bg-secondary-dark/30">
          <h2 className="text-lg font-bold mb-4">Manage Categories</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. Electricity"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="input-base flex-1"
            />
            <button
              onClick={addCategory}
              disabled={saving}
              className="btn btn-primary"
            >
              Add Category
            </button>
            <button
              onClick={() => setInputValues({})}
              className="btn btn-outline"
            >
              Clear All
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default App;
