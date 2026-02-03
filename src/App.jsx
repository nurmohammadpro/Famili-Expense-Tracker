import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const App = (props) => {
  const expenseItems = [
    { label: "House Rent", key: "houseRent" },
    { label: "Internet", key: "internet" },
    { label: "Grocery", key: "grocery" },
    { label: "Fish", key: "fish" },
    { label: "Meat", key: "meat" },
    { label: "Chicken", key: "chicken" },
    { label: "Vegetables", key: "vegetables" },
    { label: "Fruits", key: "fruits" },
    { label: "Medicine", key: "medicine" },
    { label: "Baby Items", key: "babyItems" },
    { label: "Travel exp", key: "travelExp" },
    { label: "Others", key: "others" },
  ];

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState("daily");
  const [inputValues, setInputValues] = useState({});
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };
  const todayString = formatDate(currentDate);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("id");

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error("Error loading categories", error);
    }
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const { data, error } = supabase
        .from("expenses")
        .select(
          `*,
        expense_categories(name, icon, color)
`,
        )
        .eq("date", todayString)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const inputData = {};
      data.forEach((expense) => {
        inputData[expense.category] = expense.amount;
      });

      setInputValues(inputData);
      setExpenses(data);
    } catch (error) {
      console.error("Error loading expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyTotal = async () => {
    try {
      const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );
      const startDate = formatDate(startOfMonth);
      const endDate = formatDate(endOfMonth);

      const { data, error } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", startDate)
        .lte("date", endDate);

      if (error) throw error;

      const total = data.reduce(
        (sum, expense) => sum + parseFloat(expense.amount || 0),
        0,
      );
      setMonthlyTotal(total.toFixed(2));
    } catch (error) {
      console.error("Error calculating monthly total:", error);
    }
  };

  const saveExpenses = async () => {
    try {
      const { error: deleteError } = await supabase
        .from("expenses")
        .delete()
        .eq("date", todayString);

      if (deleteError) throw deleteError;

      const expensesToInsert = Object.entries(inputValues)
        .filter(([__, amount]) => amount && parseFloat(amount) > 0)
        .map(([category, amount]) => ({
          date: todayString,
          category,
          amount: parseFloat(amount),
          description: `${category} expense`,
          created_at: new Date().toISOString(),
        }));

      if (expensesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("expenses")
          .insert(expensesToInsert);

        if (insertError) throw insertError;
      }

      await loadExpenses();
      await calculateMonthlyTotal();

      alert("Expenses saved successfully");
    } catch (error) {
      console.error("Error saving expenses:", error);
    }
  };

  const handleInputChange = (category, value) => {
    setInputValues((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const calculateDailyTotal = () => {
    return Object.values(inputValues).reduce((sum, val) => {
      return sum + (parseFloat(val) || 0);
    }, 0);
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadCategories();
      await loadExpenses();
      await calculateMonthlyTotal();
    };
    initializeData;
  }, [todayString]);

  const navigateData = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );

  return <div className="w-full max-w-7xl mx-auto p-4"></div>;
};

export default App;
