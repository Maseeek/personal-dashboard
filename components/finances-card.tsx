"use client";

import React, { useState } from "react";
import { FinancialTransaction } from "@/lib/mock-data";

interface FinancesCardProps {
  transactions: FinancialTransaction[];
  onUpdateTransactions: (transactions: FinancialTransaction[]) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isEditing?: boolean;
  colSpan?: number;
  rowSpan?: number;
  onCycleColSpan?: () => void;
  onCycleRowSpan?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
}

const CATEGORIES = [
  "Food & Drinks",
  "Health",
  "Utilities",
  "Work",
  "Entertainment",
  "Shopping",
  "Other"
];

export default function FinancesCard({ 
  transactions, 
  onUpdateTransactions,
  isCollapsed = false,
  onToggleCollapse,
  isEditing = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps,
  className = ""
}: FinancesCardProps) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food & Drinks");
  const [amountText, setAmountText] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [filterCategory, setFilterCategory] = useState("All");

  // Sums calculations
  const incomeSum = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseSum = transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = incomeSum - expenseSum;

  // Add transaction handler
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountText.trim()) return;

    const value = parseFloat(amountText);
    if (isNaN(value) || value <= 0) return;

    const finalAmount = type === "income" ? value : -value;

    const newTx: FinancialTransaction = {
      id: "t-" + Math.random().toString(36).substr(2, 9),
      description: description.trim(),
      category: type === "income" ? "Income" : category,
      amount: finalAmount,
      date: new Date().toISOString().split("T")[0]
    };

    onUpdateTransactions([newTx, ...transactions]);
    setDescription("");
    setAmountText("");
  };

  // Delete transaction handler
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    onUpdateTransactions(updated);
  };

  // Filter transactions
  const filteredTransactions = filterCategory === "All"
    ? transactions
    : transactions.filter((t) => t.category === filterCategory || (filterCategory === "Income" && t.amount > 0) || (filterCategory === "Expenses" && t.amount < 0));

  // Determine category color dots
  const getCategoryColor = (cat: string, amt: number) => {
    if (amt > 0) return "bg-emerald-400"; // Income
    switch (cat) {
      case "Food & Drinks": return "bg-orange-400";
      case "Health": return "bg-sky-400";
      case "Utilities": return "bg-amber-400";
      case "Entertainment": return "bg-purple-400";
      case "Shopping": return "bg-rose-400";
      default: return "bg-zinc-400";
    }
  };

  return (
    <div className={`glass-card flex flex-col w-full transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[380px] h-full"} ${className}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-grow min-h-0 gap-6"}>
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">FINANCES LEDGER</h2>
              {!isCollapsed && <p className="text-[10px] font-mono text-zinc-500">REAL-TIME BUDGET TRACKING</p>}
            </div>
            {isCollapsed && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                <span className="text-zinc-500">NET:</span>
                <span className={`font-bold ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Ledger Filter (only when expanded) */}
            {!isCollapsed && (
              <select
                id="finance-filter-category"
                name="financeFilterCategory"
                aria-label="Filter transactions by category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-white/5 border border-white/10 text-zinc-300 font-mono text-[9px] uppercase font-semibold px-2 py-1 rounded-xl focus:outline-none focus:border-orange-500/50"
              >
                <option value="All" className="bg-[#050506] text-white">ALL</option>
                <option value="Income" className="bg-[#050506] text-white">INCOME</option>
                <option value="Expenses" className="bg-[#050506] text-white">EXPENSES</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#050506] text-white">{cat.toUpperCase()}</option>
                ))}
              </select>
            )}

            {/* Layout edit controls */}
            {isEditing && (
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5 font-mono text-[9px] font-bold">
                <button
                  type="button"
                  onClick={onCycleColSpan}
                  className="hover:bg-white/10 text-zinc-400 hover:text-white px-1.5 py-0.5 rounded transition-colors"
                  title="Cycle Column Span"
                >
                  ↔ {colSpan}x
                </button>
                <button
                  type="button"
                  onClick={onCycleRowSpan}
                  className="hover:bg-white/10 text-zinc-400 hover:text-white px-1.5 py-0.5 rounded border-l border-white/10 transition-colors"
                  title="Cycle Row Span"
                >
                  ↕ {rowSpan}x
                </button>
              </div>
            )}

            {/* Collapse toggle */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="text-zinc-500 hover:text-white p-1 transition-colors text-[10px]"
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? "▼" : "▲"}
              </button>
            )}

            {/* Drag Handle */}
            {isEditing && (
              <div
                {...dragHandleProps}
                className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white p-1 text-xs select-none"
                title="Drag Card"
              >
                ⠿
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Financial Highlights */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 shrink-0">
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2 sm:p-3 font-mono text-center min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 mb-1 truncate">Income</p>
                <p className="text-xs sm:text-sm font-semibold text-emerald-400 truncate">+${incomeSum.toFixed(0)}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2 sm:p-3 font-mono text-center min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 mb-1 truncate">Expenses</p>
                <p className="text-xs sm:text-sm font-semibold text-[#e07658] truncate">-${expenseSum.toFixed(0)}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-2 sm:p-3 font-mono text-center min-w-0">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-500 mb-1 truncate">Net</p>
                <p className={`text-xs sm:text-sm font-semibold truncate ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {netBalance >= 0 ? "+" : "-"}${Math.abs(netBalance).toFixed(0)}
                </p>
              </div>
            </div>

            {/* Transaction ledger list */}
            <div className="space-y-2 flex-grow min-h-0 overflow-y-auto pr-1 mb-8 border border-white/5 bg-black/20 rounded-xl p-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-zinc-500">
                  NO TRANSACTION RECORDS MATCHING FILTER
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-150 bg-white/[0.01]"
                  >
                    <div className="flex items-center gap-3">
                      {/* Category dot */}
                      <span className={`w-2 h-2 rounded-full ${getCategoryColor(tx.category, tx.amount)}`} />
                      
                      {/* Ledger Details */}
                      <div className="flex flex-col font-mono">
                        <span className="text-xs font-medium text-zinc-200">{tx.description}</span>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-wide">
                          {tx.category} • {tx.date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono">
                      <span className={`text-xs font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-zinc-300"}`}>
                        {tx.amount > 0 ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                      </span>
                      
                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-500 transition-all text-xs"
                        title="Delete Entry"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Transaction Entry Form */}
      {!isCollapsed && (
        <form onSubmit={handleAddTransaction} className="border-t border-white/10 pt-6 shrink-0">
          <div className="flex items-center gap-2 mb-3 bg-white/5 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`px-3 py-1 rounded-lg font-mono text-[9px] uppercase font-bold transition-all ${
                type === "expense"
                  ? "bg-[#e07658] text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`px-3 py-1 rounded-lg font-mono text-[9px] uppercase font-bold transition-all ${
                type === "income"
                  ? "bg-emerald-400 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Income
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <input
              id="finance-description"
              name="financeDescription"
              aria-label="Transaction description"
              type="text"
              placeholder="Description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/80 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none transition-all placeholder-zinc-500"
              required
            />
            {type === "expense" ? (
              <select
                id="finance-category"
                name="financeCategory"
                aria-label="Transaction category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/80 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none transition-all"
              >
                {CATEGORIES.filter((c) => c !== "Work").map((cat) => (
                  <option key={cat} value={cat} className="bg-[#050506] text-white">
                    {cat}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-500 select-none flex items-center">
                CATEGORY: INCOME
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-grow">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">$</span>
              <input
                id="finance-amount"
                name="financeAmount"
                aria-label="Transaction amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount..."
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/80 rounded-xl pl-6 pr-3 py-2 text-xs font-mono text-white outline-none transition-all placeholder-zinc-500"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-white/10 hover:bg-[#e07658] hover:text-black border border-white/5 hover:border-[#e07658] text-white px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all flex-shrink-0"
            >
              + RECORD
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
