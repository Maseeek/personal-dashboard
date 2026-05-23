"use client";

import React, { useState } from "react";
import { CalendarEvent } from "@/lib/mock-data";

interface CalendarCardProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
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

export default function CalendarCard({
  events,
  onUpdateEvents,
  isCollapsed = false,
  onToggleCollapse,
  isEditing = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps,
  className = "",
}: CalendarCardProps) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState<"work" | "gym" | "social" | "other">("work");
  const [isAdding, setIsAdding] = useState(false);

  // Sorting events by start time
  const sortedEvents = [...events].sort((a, b) => a.start.localeCompare(b.start));

  // Find the next upcoming event for collapsed mini-summary
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const nextEvent = sortedEvents.find((ev) => ev.start >= currentTime);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;

    const newEvent: CalendarEvent = {
      id: "e-" + Math.random().toString(36).substr(2, 9),
      title: title.trim(),
      start,
      end,
      category,
    };

    onUpdateEvents([...events, newEvent]);
    setTitle("");
    setStart("");
    setEnd("");
    setCategory("work");
    setIsAdding(false);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    onUpdateEvents(updated);
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case "gym":
        return {
          border: "border-orange-500/40 bg-orange-500/[0.04]",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-[0_0_10px_rgba(224,118,88,0.25)]",
          dot: "bg-orange-500",
          label: "GYM WORKOUT",
        };
      case "work":
        return {
          border: "border-sky-500/20 bg-sky-500/[0.01]",
          badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
          dot: "bg-sky-400",
          label: "WORK SYNC",
        };
      case "social":
        return {
          border: "border-purple-500/20 bg-purple-500/[0.01]",
          badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          dot: "bg-purple-400",
          label: "SOCIAL EVENT",
        };
      default:
        return {
          border: "border-white/5 bg-white/[0.005]",
          badge: "bg-white/5 text-zinc-400 border-white/5",
          dot: "bg-zinc-400",
          label: "CALENDAR",
        };
    }
  };

  return (
    <div className={`glass-card flex flex-col w-full transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[380px] h-full"} ${className}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-grow min-h-0 gap-6"}>
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">TODAY SCHEDULE</h2>
              {!isCollapsed && (
                <p className="text-[10px] font-mono text-zinc-500">INTEGRATED CALENDAR // WORKOUTS</p>
              )}
            </div>
            {isCollapsed && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                {nextEvent ? (
                  <>
                    <span className="text-[#e07658] font-bold">Next:</span>
                    <span className="text-zinc-300 truncate max-w-[100px]">{nextEvent.title}</span>
                    <span className="text-zinc-600">@</span>
                    <span className="text-zinc-300 font-bold">{nextEvent.start}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">No more events</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-zinc-300 font-mono text-[10px] uppercase font-semibold px-2.5 py-1.5 rounded-xl border border-white/5 hover:border-white/10 transition-all duration-200"
              >
                <span>{isAdding ? "✕ CLOSE" : "+ SCHEDULE"}</span>
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
            {/* Add Event Form */}
            {isAdding && (
              <form
                onSubmit={handleAddEvent}
                className="mb-6 p-4 bg-black/40 border border-white/5 rounded-2xl font-mono text-xs space-y-3 shrink-0"
              >
                <div className="flex flex-col gap-1">
                  <label className="text-zinc-500 text-[9px] uppercase">Event Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Legs Session at Gym"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500/80 rounded-xl px-3 py-2 text-white outline-none transition-all placeholder-zinc-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 text-[9px] uppercase">Start Time</label>
                    <input
                      type="time"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-orange-500/80 rounded-xl px-3 py-2 text-white outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-zinc-500 text-[9px] uppercase">End Time</label>
                    <input
                      type="time"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-orange-500/80 rounded-xl px-3 py-2 text-white outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-zinc-500 text-[9px] uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "work" | "gym" | "social" | "other")}
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500/80 rounded-xl px-3 py-2 text-zinc-300 outline-none transition-all"
                  >
                    <option value="work" className="bg-[#050506] text-white">Work Sync</option>
                    <option value="gym" className="bg-[#050506] text-white">Gym Workout</option>
                    <option value="social" className="bg-[#050506] text-white">Social Event</option>
                    <option value="other" className="bg-[#050506] text-white">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-white/10 hover:bg-[#e07658] hover:text-black border border-white/5 hover:border-[#e07658] text-white font-bold py-2 rounded-xl transition-all text-[10px] uppercase"
                >
                  Add to Schedule
                </button>
              </form>
            )}

            {/* Schedule List */}
            <div className="space-y-3 flex-grow min-h-0 overflow-y-auto pr-1">
              {sortedEvents.length === 0 ? (
                <div className="text-center py-10 text-xs font-mono text-zinc-500 border border-dashed border-white/5 rounded-xl">
                  NO EVENTS SCHEDULED FOR TODAY
                </div>
              ) : (
                sortedEvents.map((ev) => {
                  const theme = getCategoryTheme(ev.category);
                  return (
                    <div
                      key={ev.id}
                      className={`group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${theme.border}`}
                    >
                      <div className="flex items-start gap-3 flex-grow mr-2">
                        <div className="flex flex-col items-center pt-1 flex-shrink-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                        </div>
                        <div className="flex flex-col font-mono">
                          <span className="text-xs font-semibold text-zinc-100">{ev.title}</span>
                          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
                            {ev.start} - {ev.end}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[8px] font-bold border rounded px-1.5 py-0.5 tracking-wider uppercase ${theme.badge}`}>
                          {theme.label}
                        </span>
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-500 transition-opacity duration-150 text-xs font-bold"
                          title="Delete Event"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="font-mono text-[9px] text-zinc-600 border-t border-white/5 pt-4 text-center mt-4 uppercase shrink-0">
          Connected: Google Calendar (API // Cache Local-Mirror)
        </div>
      )}
    </div>
  );
}
