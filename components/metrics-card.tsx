"use client";

import React, { useState } from "react";
import { HealthMetrics } from "@/lib/mock-data";

interface MetricsCardProps {
  metrics: HealthMetrics;
  onUpdateMetrics: (metrics: HealthMetrics) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isEditing?: boolean; // Layout edit mode
  colSpan?: number;
  rowSpan?: number;
  onCycleColSpan?: () => void;
  onCycleRowSpan?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  className?: string;
}

export default function MetricsCard({ 
  metrics, 
  onUpdateMetrics,
  isCollapsed = false,
  onToggleCollapse,
  isEditing: isEditingLayout = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps,
  className = ""
}: MetricsCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "local" | "error">("local");
  const [isEditingManual, setIsEditingManual] = useState(false);

  // Edit fields state
  const [editSteps, setEditSteps] = useState(metrics.steps);
  const [editSleep, setEditSleep] = useState(metrics.sleepHours);
  const [editAvgHR, setEditAvgHR] = useState(metrics.avgHeartRate);

  // Steps calculations
  const stepsPercent = Math.min(100, (metrics.steps / metrics.stepsGoal) * 100);

  // Sleep breakdown calculations
  const totalBreakdown = metrics.sleepBreakdown.deep + metrics.sleepBreakdown.light + metrics.sleepBreakdown.rem;
  const deepPercent = (metrics.sleepBreakdown.deep / totalBreakdown) * 100;
  const lightPercent = (metrics.sleepBreakdown.light / totalBreakdown) * 100;
  const remPercent = (metrics.sleepBreakdown.rem / totalBreakdown) * 100;

  // Google Health API sync call
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus("syncing");
    try {
      const res = await fetch("/api/health/sync", {
        method: "POST",
      });
      
      if (res.status === 400 || res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "need_auth" || res.status === 401) {
          // Automatically redirect to Google OAuth integration flow (which also logs you in)
          window.location.href = "/api/auth/google";
          return;
        }
      }

      if (!res.ok) {
        throw new Error("API sync failed");
      }

      const updatedMetrics = await res.json();
      onUpdateMetrics(updatedMetrics);
      setEditSteps(updatedMetrics.steps);
      setEditSleep(updatedMetrics.sleepHours);
      setEditAvgHR(updatedMetrics.avgHeartRate);
      setSyncStatus("synced");
    } catch (err) {
      console.warn("Google Health API sync failed, falling back to local:", err);
      setSyncStatus("error");
      setTimeout(() => setSyncStatus("local"), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: HealthMetrics = {
      ...metrics,
      steps: editSteps,
      sleepHours: editSleep,
      avgHeartRate: editAvgHR,
    };
    onUpdateMetrics(updated);
    setIsEditingManual(false);
  };

  return (
    <div className={`glass-card flex flex-col w-full transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[380px] h-full"} ${className}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-1 min-h-0 gap-6"}>
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 text-left">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">FITBIT HEALTH</h2>
              {!isCollapsed && (
                <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1.5 select-none">
                  {syncStatus === "synced" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)] animate-pulse" />
                      <span>SYNCED TO CLOUD</span>
                    </>
                  )}
                  {syncStatus === "syncing" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-ping" />
                      <span>SYNCING...</span>
                    </>
                  )}
                  {syncStatus === "local" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <span>SAVED LOCALLY</span>
                    </>
                  )}
                  {syncStatus === "error" && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                      <span>SYNC ERROR // LOCAL VIEW</span>
                    </>
                  )}
                </div>
              )}
            </div>
            {isCollapsed && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                <span className="text-[#e07658] font-bold">{metrics.steps.toLocaleString()} steps</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-300 font-bold">{metrics.sleepHours}h sleep</span>
                <span className="text-zinc-600">|</span>
                <span>{metrics.avgHeartRate} bpm</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <>
                <button
                  onClick={() => setIsEditingManual(!isEditingManual)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 text-[9px] font-mono font-bold px-2.5 py-1 rounded-xl transition-all"
                >
                  {isEditingManual ? "CANCEL" : "MANUAL"}
                </button>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase font-semibold transition-all duration-300 border ${
                    isSyncing
                      ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                      : "bg-white/5 text-zinc-300 border-white/5 hover:border-white/10"
                  }`}
                >
                  {isSyncing ? (
                    <>
                      <span className="w-2 h-2 rounded-full border border-orange-400 border-t-transparent animate-spin inline-block" />
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <>
                      <span>↻</span>
                      <span>Sync Fitbit</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Layout edit controls */}
            {isEditingLayout && (
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
            {isEditingLayout && (
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
            {isEditingManual ? (
              /* Manual override form */
              <form onSubmit={handleSaveEdit} className="space-y-4 font-mono text-xs p-4 bg-black/40 border border-white/5 rounded-xl shrink-0">
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="edit-steps" className="text-zinc-500 uppercase text-[9px]">Daily Steps</label>
                  <input
                    id="edit-steps"
                    name="editSteps"
                    type="number"
                    value={editSteps}
                    onChange={(e) => setEditSteps(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/80"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="edit-sleep" className="text-zinc-500 uppercase text-[9px]">Sleep Hours</label>
                  <input
                    id="edit-sleep"
                    name="editSleep"
                    type="number"
                    step="0.1"
                    value={editSleep}
                    onChange={(e) => setEditSleep(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/80"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label htmlFor="edit-heart-rate" className="text-zinc-500 uppercase text-[9px]">Average Heart Rate (bpm)</label>
                  <input
                    id="edit-heart-rate"
                    name="editAvgHR"
                    type="number"
                    value={editAvgHR}
                    onChange={(e) => setEditAvgHR(parseInt(e.target.value) || 0)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/80"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#e07658] text-black font-bold uppercase py-2 rounded-xl hover:bg-orange-400 transition-all text-[10px]"
                >
                  Save Overrides
                </button>
              </form>
            ) : (
              /* Display Metrics */
              <div className="space-y-8 flex-grow min-h-0 overflow-y-auto pr-1 flex flex-col justify-between">
                {/* Steps Block */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 shrink-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">DAILY STEPS</span>
                    <span className="text-xs font-mono text-white font-semibold">
                      {metrics.steps.toLocaleString()} / {metrics.stepsGoal.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(52,211,153,0.3)]"
                      style={{ width: `${stepsPercent}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-zinc-500 mt-2 text-right truncate">
                    <span className="hidden sm:inline">{stepsPercent.toFixed(0)}% OF DAILY TARGET COMPLETED</span>
                    <span className="sm:hidden">{stepsPercent.toFixed(0)}% OF TARGET</span>
                  </p>
                </div>

                {/* Sleep Block */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">SLEEP CYCLES</span>
                    <span className="text-xs font-mono text-white font-semibold">
                      {metrics.sleepHours}h / {metrics.sleepGoal}h GOAL
                    </span>
                  </div>

                  {/* Stacked breakdown progress bar */}
                  <div className="w-full bg-white/5 h-3.5 rounded-full overflow-hidden flex mb-3">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${deepPercent}%` }}
                      title={`Deep Sleep: ${metrics.sleepBreakdown.deep}h`}
                    />
                    <div
                      className="h-full bg-sky-400 transition-all duration-500"
                      style={{ width: `${lightPercent}%` }}
                      title={`Light Sleep: ${metrics.sleepBreakdown.light}h`}
                    />
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${remPercent}%` }}
                      title={`REM Sleep: ${metrics.sleepBreakdown.rem}h`}
                    />
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px] text-zinc-400 pt-1">
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                        <span className="text-white font-bold">{metrics.sleepBreakdown.deep}h</span>
                      </div>
                      <span className="text-zinc-600 text-[8px] uppercase">DEEP</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                        <span className="text-white font-bold">{metrics.sleepBreakdown.light}h</span>
                      </div>
                      <span className="text-zinc-600 text-[8px] uppercase">LIGHT</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        <span className="text-white font-bold">{metrics.sleepBreakdown.rem}h</span>
                      </div>
                      <span className="text-zinc-600 text-[8px] uppercase">REM</span>
                    </div>
                  </div>
                </div>

                {/* Heart Rate Block */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-2 font-mono shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl animate-pulse text-rose-500 select-none">♥</div>
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">HEART RATE</span>
                      <span className="text-xs text-zinc-300">CARDIO ZONE</span>
                    </div>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-center sm:text-right">
                      <span className="text-[9px] text-zinc-500 uppercase block">RESTING</span>
                      <span className="text-sm font-bold text-white">{metrics.restingHeartRate} <span className="text-[10px] font-normal text-zinc-500">bpm</span></span>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="text-[9px] text-zinc-500 uppercase block">AVERAGE</span>
                      <span className="text-sm font-bold text-rose-400">{metrics.avgHeartRate} <span className="text-[10px] font-normal text-zinc-500">bpm</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="font-mono text-[9px] text-zinc-600 border-t border-white/5 pt-4 text-center mt-4 shrink-0">
          HARDWARE ID: FITBIT-AIR-G77 • AUTOMATIC SYNC EVERY 4 HOURS
        </div>
      )}
    </div>
  );
}
