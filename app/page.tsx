"use client";

import React, { useEffect, useState, useRef } from "react";
import GoalsTicker from "@/components/ticker";
import DayRing from "@/components/day-ring";
import TodoCard from "@/components/todo-card";
import FinancesCard from "@/components/finances-card";
import MetricsCard from "@/components/metrics-card";
import CalendarCard from "@/components/calendar-card";
import LedCard from "@/components/led-card";
import { db, CardState } from "@/lib/db";
import { Goal, FinancialTransaction, HealthMetrics, CalendarEvent } from "@/lib/mock-data";

// Map colSpan number to Tailwind CSS class
function colSpanClass(span: number, collapsed: boolean): string {
  if (collapsed) return "col-span-1";
  switch (span) {
    case 2: return "col-span-1 md:col-span-2";
    case 3: return "col-span-1 md:col-span-2 lg:col-span-3";
    default: return "col-span-1";
  }
}

// Map rowSpan number to Tailwind CSS class (contracts to 1 when collapsed)
function rowSpanClass(span: number, collapsed: boolean): string {
  if (collapsed) return "row-span-1";
  return span >= 2 ? "row-span-1 lg:row-span-2" : "row-span-1";
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [layout, setLayout] = useState<CardState[]>([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load all data on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setGoals(db.getGoals());
      setTransactions(db.getTransactions());
      setMetrics(db.getMetrics());
      setEvents(db.getEvents());
      setLayout(db.getLayout());
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // ---- Data update handlers ----
  const handleUpdateGoals = (newGoals: Goal[]) => { setGoals(newGoals); db.saveGoals(newGoals); };
  const handleUpdateTransactions = (newTxs: FinancialTransaction[]) => { setTransactions(newTxs); db.saveTransactions(newTxs); };
  const handleUpdateMetrics = (newMetrics: HealthMetrics) => { setMetrics(newMetrics); db.saveMetrics(newMetrics); };
  const handleUpdateEvents = (newEvents: CalendarEvent[]) => { setEvents(newEvents); db.saveEvents(newEvents); };

  // ---- Layout mutation helpers ----
  const updateLayout = (newLayout: CardState[]) => {
    setLayout(newLayout);
    db.saveLayout(newLayout);
  };

  const toggleCollapse = (id: string) => {
    const updated = layout.map((c) => c.id === id ? { ...c, isCollapsed: !c.isCollapsed } : c);
    updateLayout(updated);
  };

  const cycleColSpan = (id: string) => {
    const updated = layout.map((c) => {
      if (c.id !== id) return c;
      const next = c.colSpan >= 3 ? 1 : c.colSpan + 1;
      return { ...c, colSpan: next };
    });
    updateLayout(updated);
  };

  const cycleRowSpan = (id: string) => {
    const updated = layout.map((c) => {
      if (c.id !== id) return c;
      const next = c.rowSpan >= 2 ? 1 : c.rowSpan + 1;
      return { ...c, rowSpan: next };
    });
    updateLayout(updated);
  };

  // ---- Drag-and-Drop handlers ----
  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = dragIndexRef.current;
    if (dragIndex === null || dragIndex === dropIndex) {
      dragIndexRef.current = null;
      setDragOverIndex(null);
      return;
    }

    const newLayout = [...layout];
    const [dragged] = newLayout.splice(dragIndex, 1);
    newLayout.splice(dropIndex, 0, dragged);
    updateLayout(newLayout);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  };

  if (!mounted || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow min-h-screen text-zinc-500 font-mono text-xs gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-white/5 border-t-[#e07658] animate-spin" />
        <span>INITIALIZING DASHBOARD INDEX ENGINE // LOAD STATE</span>
      </div>
    );
  }

  // Render the correct card component for each layout entry
  const renderCard = (cardState: CardState, index: number) => {
    const { id, colSpan, rowSpan, isCollapsed } = cardState;
    const isDragTarget = dragOverIndex === index;

    const wrapperClass = [
      colSpanClass(colSpan, isCollapsed),
      rowSpanClass(rowSpan, isCollapsed),
      "transition-all duration-300",
      isCollapsed ? "self-start h-auto" : "self-stretch h-full",
      isDragTarget ? "card-drag-over" : "",
    ].filter(Boolean).join(" ");

    const dragProps = {
      draggable: isEditingLayout,
      onDragStart: (e: React.DragEvent) => handleDragStart(e, index),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
      onDrop: (e: React.DragEvent) => handleDrop(e, index),
      onDragEnd: handleDragEnd,
    };

    const cardDragHandleProps = {
      onMouseDown: () => { /* handled by draggable on parent */ },
    };

    const sharedLayoutProps = {
      isCollapsed,
      onToggleCollapse: () => toggleCollapse(id),
      isEditing: isEditingLayout,
      colSpan,
      rowSpan,
      onCycleColSpan: () => cycleColSpan(id),
      onCycleRowSpan: () => cycleRowSpan(id),
      dragHandleProps: cardDragHandleProps,
    };

    let cardContent: React.ReactNode;

    switch (id) {
      case "todo":
        cardContent = (
          <TodoCard
            goals={goals}
            onUpdateGoals={handleUpdateGoals}
            {...sharedLayoutProps}
          />
        );
        break;
      case "day-ring":
        cardContent = (
          <DayRing
            {...sharedLayoutProps}
          />
        );
        break;
      case "finances":
        cardContent = (
          <FinancesCard
            transactions={transactions}
            onUpdateTransactions={handleUpdateTransactions}
            {...sharedLayoutProps}
          />
        );
        break;
      case "metrics":
        cardContent = (
          <MetricsCard
            metrics={metrics}
            onUpdateMetrics={handleUpdateMetrics}
            {...sharedLayoutProps}
          />
        );
        break;
      case "calendar":
        cardContent = (
          <CalendarCard
            events={events}
            onUpdateEvents={handleUpdateEvents}
            {...sharedLayoutProps}
          />
        );
        break;
      case "led-card":
        cardContent = (
          <LedCard
            {...sharedLayoutProps}
          />
        );
        break;
      default:
        return null;
    }

    return (
      <div
        key={id}
        className={wrapperClass}
        {...(isEditingLayout ? dragProps : {})}
      >
        {cardContent}
      </div>
    );
  };

  return (
    <main className="flex flex-col gap-8 px-6 sm:px-10 md:px-14 lg:px-16 py-10 lg:py-12 max-w-[1920px] mx-auto w-full flex-grow relative z-10">
      {/* Title Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-8 mb-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black tracking-wider font-sans text-white flex items-center gap-3 flex-wrap">
            <span>PERSONAL DASHBOARD</span>
            <span className="text-[10px] sm:text-xs bg-[#e07658]/20 text-[#e07658] border border-[#e07658]/30 px-3 py-1 rounded-full font-bold tracking-widest whitespace-nowrap">
              PRO-EDITION
            </span>
          </h1>
          <p className="text-[10px] sm:text-[11px] font-sans font-medium text-zinc-400 mt-2 uppercase tracking-[0.2em] leading-relaxed">
            OPERATIONAL INDEX SYSTEM // BIOMETRICS • LEDGERS • SCHEDULES
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Edit Layout Toggle */}
          <button
            onClick={() => setIsEditingLayout((v) => !v)}
            className={`flex items-center gap-2 font-mono text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg border transition-all duration-200 cursor-pointer ${
              isEditingLayout
                ? "bg-[#e07658]/20 text-[#e07658] border-[#e07658]/40 shadow-[0_0_14px_rgba(224,118,88,0.25)]"
                : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/10 hover:text-white"
            }`}
          >
            <span>{isEditingLayout ? "⊘" : "⊞"}</span>
            <span className="hidden sm:inline">{isEditingLayout ? "LOCK LAYOUT" : "EDIT LAYOUT"}</span>
          </button>

          <div className="font-mono text-right text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-widest flex flex-col items-end">
            <span className="hidden sm:inline">SYS STATUS: ACTIVE // NO DEPLOY CONFLICTS</span>
            <span className="sm:hidden">SYS: ACTIVE</span>
            <span className="text-[#e07658] mt-0.5 font-bold">UTC LOCALIZED FEED</span>
          </div>
        </div>
      </header>

      {/* Nasdaq goals ticker banner */}
      <section className="w-full">
        <GoalsTicker goals={goals} />
      </section>

      {/* Edit mode indicator banner */}
      {isEditingLayout && (
        <div className="w-full flex items-center gap-2 bg-[#e07658]/10 border border-[#e07658]/20 rounded-xl px-4 py-2 font-mono text-[10px] text-[#e07658] uppercase tracking-wider">
          <span className="animate-pulse">●</span>
          <span>LAYOUT EDIT MODE ACTIVE — Drag cards to reorder • Click ↔/↕ to resize spans • Click ▲ to collapse</span>
        </div>
      )}

      {/* Unified Modular Dashboard Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {layout.map((cardState, index) => renderCard(cardState, index))}
      </section>

      {/* Footer copyright */}
      <footer className="mt-16 border-t border-white/5 pt-6 font-mono text-[9px] text-zinc-600 flex justify-between items-center uppercase tracking-widest select-none">
        <span>© 2026 ANTIGRAVITY ENGINE</span>
        <span>VER: 2.0.0-MODULAR</span>
      </footer>
    </main>
  );
}
