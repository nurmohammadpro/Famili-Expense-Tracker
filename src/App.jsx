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
import Button from "./components/Button";
import Input from "./components/Input";
import Card from "./components/Card";

const ExpenseChart = ({ data, categories }) => {
  const chartData = categories
    .map((cat) => ({
      name: cat.name,
      value: parseFloat(data[cat.id] || 0),
    }))
    .filter((item) => item.value > 0);

  const COLORS = [
    "oklch(44.6% 0.043 257.281)",
    "oklch(72.3% 0.219 149.579)",
    "oklch(63.7% 0.237 25.331)",
    "oklch(27.9% 0.041 260.031)",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
  ];

  if (chartData.length === 0) return null;

  return (
    <Card className="animate-fade-in">
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
    </Card>
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

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: cats } = await supabase
        .from("expense_categories")
        .select("*")
        .order("id");
      setCategories(cats || []);

      const { data: exps } = await supabase
        .from("expenses")
        .select(`*, expense_categories!fk_expense_categories (name, icon)`)
        .eq("date", todayString);

      const inputs = {};
      exps?.forEach((e) => (inputs[e.category_id] = e.amount));
      setInputValues(inputs);
      setExpenses(exps || []);
    } catch (err) {
      setError("Failed to sync data");
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = async () => {
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
    setMonthlyTotal(
      data?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0,
    );
  };

  useEffect(() => {
    loadData();
  }, [todayString]);
  useEffect(() => {
    calculateMonthlyTotal();
  }, [todayString]);

  const saveExpenses = async () => {
    setSaving(true);
    const toInsert = categories
      .filter((cat) => inputValues[cat.id] > 0)
      .map((cat) => ({
        date: todayString,
        category_id: cat.id,
        amount: parseFloat(inputValues[cat.id]).toFixed(2),
        description: `${cat.name} expense`,
      }));

    if (toInsert.length === 0) {
      setSaving(false);
      return setError("Please enter an amount.");
    }

    await supabase.from("expenses").delete().eq("date", todayString);
    await supabase.from("expenses").insert(toInsert);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setSaving(false);
    loadData();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-secondary-light">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light" />
      </div>
    );

  return (
    <div className="w-full min-h-screen bg-secondary-light p-4 md:p-8 font-display">
      {showSuccess && (
        <div className="fixed top-6 right-6 z-50 bg-success text-white px-6 py-3 rounded-lg shadow-xl animate-fade-in">
          ✅ Synced Successfully
        </div>
      )}

      <div className="container-narrow space-y-8">
        <header className="card grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-xl font-bold mb-2">Personal Expense Tracker</h1>
            <p className="text-primary-light font-medium">
              {currentDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setDate(currentDate.getDate() - 1)),
                  )
                }
                variant="secondary"
                size="sm"
              >
                ←
              </Button>
              <Button
                onClick={() => setCurrentDate(new Date())}
                variant="outline"
                size="sm"
              >
                Today
              </Button>
              <Button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setDate(currentDate.getDate() + 1)),
                  )
                }
                variant="secondary"
                size="sm"
              >
                →
              </Button>
            </div>
          </div>
          <Card
            variant="primary"
            className="flex justify-between items-center p-6"
          >
            <div>
              <p className="text-xs uppercase font-bold opacity-70">Monthly</p>
              <p className="text-3xl font-black">
                {monthlyTotal.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold opacity-70">Today</p>
              <p className="text-xl font-bold text-success">
                {Object.values(inputValues)
                  .reduce((a, b) => a + (parseFloat(b) || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </Card>
        </header>

        <ExpenseChart data={inputValues} categories={categories} />

        <Card>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {categories.map((cat) => (
                <Input
                  key={cat.id}
                  label={cat.name}
                  icon={cat.icon}
                  type="number"
                  placeholder="0.00"
                  value={inputValues[cat.id] || ""}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, [cat.id]: e.target.value })
                  }
                />
              ))}
            </div>
            <div className="flex justify-end pt-4 border-t border-secondary-dark">
              <Button type="submit" disabled={saving} size="md">
                {saving ? "Saving..." : "Save Expenses"}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="bg-secondary-dark/30">
          <h2 className="text-lg font-bold mb-4 text-primary-dark">
            Manage Categories
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="New category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button
              onClick={async () => {
                await supabase
                  .from("expense_categories")
                  .insert([{ name: newCategoryName, icon: "📁" }]);
                setNewCategoryName("");
                loadData();
              }}
              size="md"
            >
              Add
            </Button>
            <Button
              onClick={() => setInputValues({})}
              variant="outline"
              size="md"
            >
              Clear All
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default App;
