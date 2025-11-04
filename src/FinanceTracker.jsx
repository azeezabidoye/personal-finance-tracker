import React, { useState, useEffect } from "react";
import {
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Settings,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const FinanceTracker = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({
    income: ["Salary", "Freelance", "Investment", "Other"],
    expense: [
      "Food",
      "Transport",
      "Entertainment",
      "Bills",
      "Shopping",
      "Healthcare",
      "Other",
    ],
  });
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "",
    notes: "",
  });

  const [newCategory, setNewCategory] = useState({ type: "income", name: "" });

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save data whenever transactions or categories change
  useEffect(() => {
    if (transactions.length > 0 || Object.keys(categories).length > 0) {
      saveData();
    }
  }, [transactions, categories]);

  const loadData = async () => {
    try {
      const transactionsResult = await window.storage.get("transactions");
      const categoriesResult = await window.storage.get("categories");

      if (transactionsResult && transactionsResult.value) {
        setTransactions(JSON.parse(transactionsResult.value));
      }
      if (categoriesResult && categoriesResult.value) {
        setCategories(JSON.parse(categoriesResult.value));
      }
    } catch (error) {
      console.log("No existing data found, starting fresh");
    }
  };

  const saveData = async () => {
    try {
      await window.storage.set("transactions", JSON.stringify(transactions));
      await window.storage.set("categories", JSON.stringify(categories));
    } catch (error) {
      console.error("Error saving data:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) return;

    const transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now(),
      ...formData,
      amount: parseFloat(formData.amount),
    };

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((t) => (t.id === editingTransaction.id ? transaction : t))
      );
      setEditingTransaction(null);
    } else {
      setTransactions((prev) => [...prev, transaction]);
    }

    setFormData({
      type: "expense",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      notes: "",
    });
    setShowAddTransaction(false);
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      date: transaction.date,
      category: transaction.category,
      notes: transaction.notes || "",
    });
    setShowAddTransaction(true);
  };

  const handleDelete = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) return;

    setCategories((prev) => ({
      ...prev,
      [newCategory.type]: [...prev[newCategory.type], newCategory.name.trim()],
    }));
    setNewCategory({ type: "income", name: "" });
  };

  const deleteCategory = (type, categoryName) => {
    setCategories((prev) => ({
      ...prev,
      [type]: prev[type].filter((c) => c !== categoryName),
    }));
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Category", "Amount", "Notes"];
    const rows = filteredAndSortedTransactions.map((t) => [
      t.date,
      t.type,
      t.category,
      t.amount,
      t.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Filtering and Sorting
  const filteredAndSortedTransactions = transactions
    .filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return 0;
      }
    });

  // Chart Data
  const monthlyData = transactions.reduce((acc, t) => {
    const month = t.date.substring(0, 7);
    if (!acc[month]) {
      acc[month] = { month, income: 0, expense: 0 };
    }
    if (t.type === "income") {
      acc[month].income += t.amount;
    } else {
      acc[month].expense += t.amount;
    }
    return acc;
  }, {});

  const chartData = Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  const categoryData = transactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = { name: t.category, value: 0, type: t.type };
    }
    acc[t.category].value += t.amount;
    return acc;
  }, {});

  const pieData = Object.values(categoryData);
  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];

  const availableCategories =
    filterType === "all"
      ? [...categories.income, ...categories.expense]
      : categories[filterType] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Personal Finance Tracker
          </h1>
          <p className="text-slate-600">
            Track your income and expenses with ease
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Total Income
                </p>
                <p className="text-3xl font-bold text-green-600">
                  ₦{totalIncome.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={40} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">
                  Total Expenses
                </p>
                <p className="text-3xl font-bold text-red-600">
                  ₦{totalExpenses.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="text-red-500" size={40} />
            </div>
          </div>

          <div
            className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${
              balance >= 0 ? "border-blue-500" : "border-orange-500"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Balance</p>
                <p
                  className={`text-3xl font-bold ${
                    balance >= 0 ? "text-blue-600" : "text-orange-600"
                  }`}
                >
                  ₦{balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setFormData({
                type: "expense",
                amount: "",
                date: new Date().toISOString().split("T")[0],
                category: "",
                notes: "",
              });
              setShowAddTransaction(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg"
          >
            <PlusCircle size={20} />
            Add Transaction
          </button>

          <button
            onClick={() => setShowManageCategories(true)}
            className="flex items-center gap-2 bg-slate-600 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition shadow-lg"
          >
            <Settings size={20} />
            Manage Categories
          </button>

          <button
            onClick={exportToCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>

        {/* Charts */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Income vs Expenses Over Time
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4">
                Spending by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₦${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              Filter & Sort
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date-desc">Date (Newest First)</option>
                <option value="date-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (High to Low)</option>
                <option value="amount-asc">Amount (Low to High)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            Recent Transactions
          </h3>

          {filteredAndSortedTransactions.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No transactions found. Add your first transaction to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">
                      Notes
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">
                      Amount
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 text-slate-700">
                        {transaction.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            transaction.type === "income"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {transaction.notes || "-"}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}₦
                        {transaction.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition mr-2"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Transaction Modal */}
      {showAddTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setShowAddTransaction(false);
                  setEditingTransaction(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a category</option>
                  {categories[formData.type].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes..."
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                {editingTransaction ? "Update Transaction" : "Add Transaction"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showManageCategories && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                Manage Categories
              </h2>
              <button
                onClick={() => setShowManageCategories(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">
                Add New Category
              </h3>
              <div className="flex gap-3">
                <select
                  value={newCategory.type}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Category name"
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={addCategory}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3">
                  Income Categories
                </h3>
                <div className="space-y-2">
                  {categories.income.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between bg-green-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-slate-700">{cat}</span>
                      <button
                        onClick={() => deleteCategory("income", cat)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-3">
                  Expense Categories
                </h3>
                <div className="space-y-2">
                  {categories.expense.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between bg-red-50 px-4 py-2 rounded-lg"
                    >
                      <span className="text-slate-700">{cat}</span>
                      <button
                        onClick={() => deleteCategory("expense", cat)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTracker;
