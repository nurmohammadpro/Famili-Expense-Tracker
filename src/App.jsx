import { useState } from "react";

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

  const [expenses, setExpenses] = useState({
    dailyExpenses: [],
    monthlyExpenses: [],
    yearlyExpenses: [],
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [filter, setFilter] = useState("daily");
  const [inputValues, setInputValues] = useState({});

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };
  const todayString = formatDate(currentDate);
  return <div className="w-full max-w-7xl mx-auto p-4"></div>;
};

export default App;
