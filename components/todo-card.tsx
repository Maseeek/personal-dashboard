"use client";

import React, { useState, useEffect } from "react";
import { Goal } from "@/lib/mock-data";
import { db } from "@/lib/db";

interface TodoCardProps {
  goals: Goal[];
  onUpdateGoals: (goals: Goal[]) => void;
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

export default function TodoCard({ 
  goals, 
  onUpdateGoals,
  isCollapsed = false,
  onToggleCollapse,
  isEditing = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps,
  className = ""
}: TodoCardProps) {
  const [newGoalText, setNewGoalText] = useState("");
  const [isQuickOnly, setIsQuickOnly] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [newIsQuick, setNewIsQuick] = useState(false);

  // Tomorrow Goals Planning State
  const [tomorrowGoals, setTomorrowGoals] = useState<string[]>([]);
  const [newTomorrowText, setNewTomorrowText] = useState("");
  const [isTomorrowLocked, setIsTomorrowLocked] = useState(false);

  // Load planned tomorrow goals on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const planned = db.getTomorrowGoals();
      setTomorrowGoals(planned);
      if (planned.length > 0) {
        // For demonstration, if tomorrow goals exist, we can show plan status
        setIsTomorrowLocked(localStorage.getItem("dashboard_tomorrow_locked") === "true");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Today checklist calculations
  const totalGoalsCount = goals.length;
  const completedGoalsCount = goals.filter((g) => g.completed).length;
  const progressPercent = totalGoalsCount > 0 ? (completedGoalsCount / totalGoalsCount) * 100 : 0;

  // Filter goals
  const filteredGoals = isQuickOnly ? goals.filter((g) => g.isQuickQueue) : goals;

  // Toggle goal completion
  const handleToggleGoal = (id: string) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    onUpdateGoals(updated);
  };

  // Add new goal to Today
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalText.trim()) return;

    const newGoal: Goal = {
      id: "g-" + Math.random().toString(36).substr(2, 9),
      text: newGoalText.trim(),
      completed: false,
      isQuickQueue: newIsQuick,
      dateCreated: new Date().toISOString(),
    };

    onUpdateGoals([...goals, newGoal]);
    setNewGoalText("");
    setNewIsQuick(false);
  };

  // Toggle isQuickQueue status for existing task
  const handleToggleQuickQueue = (id: string) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, isQuickQueue: !g.isQuickQueue } : g));
    onUpdateGoals(updated);
  };

  // Start inline editing
  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  // Save inline edits
  const saveEdit = (id: string) => {
    if (!editingText.trim()) return;
    const updated = goals.map((g) => (g.id === id ? { ...g, text: editingText.trim() } : g));
    onUpdateGoals(updated);
    setEditingId(null);
  };

  // Delete goal
  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    onUpdateGoals(updated);
  };

  // Move goal up/down in the list
  const moveGoal = (index: number, direction: "up" | "down") => {
    const updated = [...goals];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= goals.length) return;

    // Swap elements
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onUpdateGoals(updated);
  };

  // Plan Tomorrow Handlers
  const handleAddTomorrowGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTomorrowLocked || !newTomorrowText.trim()) return;

    const updated = [...tomorrowGoals, newTomorrowText.trim()];
    setTomorrowGoals(updated);
    db.saveTomorrowGoals(updated);
    setNewTomorrowText("");
  };

  const handleRemoveTomorrowGoal = (idx: number) => {
    if (isTomorrowLocked) return;
    const updated = tomorrowGoals.filter((_, i) => i !== idx);
    setTomorrowGoals(updated);
    db.saveTomorrowGoals(updated);
  };

  const handleLockTomorrowPlan = () => {
    if (tomorrowGoals.length === 0) return;
    setIsTomorrowLocked(true);
    localStorage.setItem("dashboard_tomorrow_locked", "true");
  };

  const handleUnlockTomorrowPlan = () => {
    setIsTomorrowLocked(false);
    localStorage.setItem("dashboard_tomorrow_locked", "false");
  };

  const handleMigrateTomorrowToToday = () => {
    // Migrate items from tomorrow list to today's goals
    const newGoals: Goal[] = tomorrowGoals.map((text) => ({
      id: "g-" + Math.random().toString(36).substr(2, 9),
      text,
      completed: false,
      isQuickQueue: false,
      dateCreated: new Date().toISOString()
    }));

    onUpdateGoals([...goals, ...newGoals]);
    
    // Clear tomorrow list
    setTomorrowGoals([]);
    db.saveTomorrowGoals([]);
    setIsTomorrowLocked(false);
    localStorage.setItem("dashboard_tomorrow_locked", "false");
  };

  return (
    <div className={`glass-card flex flex-col w-full transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[400px] h-full"} ${className}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-1 min-h-0 gap-6"}>
        {/* Header and Toggle */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">TODAY CHECKLIST</h2>
              {!isCollapsed && (
                <p className="text-[10px] font-mono text-zinc-500">
                  COMPLETED: {completedGoalsCount}/{totalGoalsCount} GOALS
                </p>
              )}
            </div>
            {isCollapsed && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                <span className="text-[#e07658] font-bold">{completedGoalsCount}/{totalGoalsCount}</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-300 font-bold">{progressPercent.toFixed(0)}%</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={() => setIsQuickOnly(!isQuickOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-semibold transition-all duration-300 border ${
                  isQuickOnly
                    ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-xs">⚡</span>
                <span className="hidden sm:inline">Quick</span>
              </button>
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
            {/* Progress bar container */}
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative shrink-0">
              <div
                className="h-full bg-gradient-to-r from-[#e07658] to-orange-400 rounded-full transition-all duration-500 ease-out shadow-[0_0_8px_rgba(224,118,88,0.4)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Goals Checklist List */}
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-zinc-500 border border-dashed border-white/5 rounded-xl">
                  {isQuickOnly ? "NO QUICK QUEUE GOALS PENDING" : "NO GOALS POSTED FOR TODAY"}
                </div>
              ) : (
                filteredGoals.map((goal) => {
                  const originalIdx = goals.findIndex((g) => g.id === goal.id);
                  return (
                    <div
                      key={goal.id}
                      className={`group flex items-center justify-between p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200 bg-white/[0.01] ${
                        goal.completed ? "opacity-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-grow mr-4">
                        {/* Custom Checkbox */}
                        <button
                          onClick={() => handleToggleGoal(goal.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${
                            goal.completed
                              ? "bg-orange-500 border-orange-500 text-black"
                              : "border-white/20 hover:border-orange-500/50 bg-transparent text-transparent"
                          }`}
                        >
                          <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>

                        {/* Editable Text */}
                        {editingId === goal.id ? (
                          <input
                            id={`edit-goal-${goal.id}`}
                            name="editingGoalText"
                            aria-label="Edit goal text"
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => saveEdit(goal.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(goal.id);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            className="bg-black/40 text-white font-mono text-xs border border-white/20 px-2 py-1 rounded w-full outline-none focus:border-orange-500/80"
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(goal.id, goal.text)}
                            className={`text-xs font-mono tracking-wide leading-relaxed cursor-text select-none text-zinc-300 hover:text-white transition-colors duration-150 ${
                              goal.completed ? "line-through text-zinc-500" : ""
                            }`}
                          >
                            {goal.text}
                          </span>
                        )}
                      </div>

                      {/* Actions Column */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Toggle Quick Queue ⚡ */}
                        <button
                          onClick={() => handleToggleQuickQueue(goal.id)}
                          className={`text-xs p-1 rounded hover:bg-white/5 transition-colors ${
                            goal.isQuickQueue ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                          }`}
                          title="Toggle Quick Queue"
                        >
                          ⚡
                        </button>

                        {/* Move Up */}
                        <button
                          onClick={() => moveGoal(originalIdx, "up")}
                          disabled={originalIdx === 0}
                          className="text-[10px] text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none p-1"
                          title="Move Up"
                        >
                          ▲
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => moveGoal(originalIdx, "down")}
                          disabled={originalIdx === goals.length - 1}
                          className="text-[10px] text-zinc-500 hover:text-white disabled:opacity-30 disabled:pointer-events-none p-1"
                          title="Move Down"
                        >
                          ▼
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-zinc-500 hover:text-rose-500 text-xs p-1 rounded hover:bg-white/5 transition-colors ml-1"
                          title="Delete Goal"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add goal form */}
            <form onSubmit={handleAddGoal} className="flex gap-2 shrink-0">
              <div className="relative flex-grow">
                <input
                  id="new-today-goal"
                  name="newTodayGoal"
                  aria-label="Add today's goal"
                  type="text"
                  placeholder="Add today's goal..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/80 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none transition-all placeholder-zinc-500"
                />
                <button
                  type="button"
                  onClick={() => setNewIsQuick(!newIsQuick)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs transition-colors duration-150 ${
                    newIsQuick ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"
                  }`}
                  title="Add to Quick Queue"
                >
                  ⚡
                </button>
              </div>
              <button
                type="submit"
                className="bg-white/10 hover:bg-[#e07658] hover:text-black border border-white/5 hover:border-[#e07658] text-white px-4 py-2 rounded-xl font-mono text-xs font-bold transition-all"
              >
                + ADD
              </button>
            </form>
          </>
        )}
      </div>

      {/* Plan Tomorrow Section */}
      {!isCollapsed && (
        <div className="border-t border-white/5 pt-6 mt-auto shrink-0">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xs uppercase tracking-widest text-zinc-400 font-mono font-medium flex items-center gap-1.5">
                <span>PLAN TOMORROW</span>
                {isTomorrowLocked && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded px-1.5 py-0.5 font-bold">
                    LOCKED
                  </span>
                )}
              </h3>
              <p className="text-[9px] font-mono text-zinc-500">QUEUE NEXT-DAY OBJECTIVES</p>
            </div>

            {isTomorrowLocked ? (
              <div className="flex gap-2">
                <button
                  onClick={handleUnlockTomorrowPlan}
                  className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 text-[9px] font-mono font-bold px-2.5 py-1 rounded-xl transition-all"
                >
                  UNLOCK
                </button>
                <button
                  onClick={handleMigrateTomorrowToToday}
                  className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/40 text-[9px] font-mono font-bold px-2.5 py-1 rounded-xl transition-all"
                >
                  MIGRATE
                </button>
              </div>
            ) : (
              tomorrowGoals.length > 0 && (
                <button
                  onClick={handleLockTomorrowPlan}
                  className="bg-[#e07658]/20 hover:bg-[#e07658] text-[#e07658] hover:text-black border border-[#e07658]/40 text-[9px] font-mono font-bold px-3 py-1 rounded-xl transition-all shadow-[0_0_8px_rgba(224,118,88,0.2)] animate-pulse"
                >
                  LOCK PLAN
                </button>
              )
            )}
          </div>

          {/* Tomorrow planned list */}
          {tomorrowGoals.length > 0 && (
            <div className="space-y-1.5 mb-4 max-h-[120px] overflow-y-auto pr-1">
              {tomorrowGoals.map((text, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/5 text-zinc-400 text-[11px] font-mono"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-600 font-bold">◆</span>
                    <span>{text}</span>
                  </span>
                  {!isTomorrowLocked && (
                    <button
                      onClick={() => handleRemoveTomorrowGoal(idx)}
                      className="text-zinc-600 hover:text-rose-500 px-1 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Plan tomorrow form */}
          {!isTomorrowLocked && (
            <form onSubmit={handleAddTomorrowGoal} className="flex gap-2">
              <input
                id="new-tomorrow-goal"
                name="newTomorrowGoal"
                aria-label="Add tomorrow's goal"
                type="text"
                placeholder="Add tomorrow's goal..."
                value={newTomorrowText}
                onChange={(e) => setNewTomorrowText(e.target.value)}
                className="flex-grow bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/80 rounded-xl px-4 py-2 text-xs font-mono text-white outline-none transition-all placeholder-zinc-500"
              />
              <button
                type="submit"
                className="bg-white/10 hover:bg-[#e07658] hover:text-black border border-white/5 hover:border-[#e07658] text-white px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all"
              >
                + PLAN
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
