"use client";

import React from "react";
import { Goal } from "@/lib/mock-data";

interface GoalsTickerProps {
  goals: Goal[];
}

export default function GoalsTicker({ goals }: GoalsTickerProps) {
  const activeGoals = goals.filter((g) => !g.completed);

  // If no active goals, display a placeholder index ticker
  const displayItems = activeGoals.length > 0 
    ? activeGoals 
    : [{ id: "empty", text: "ALL SYSTEMS OPERATIONAL // ZERO PENDING TASKS // PLAN TOMORROW LOCK" }];

  // Duplicate items to ensure smooth continuous marquee effect
  const repeatedItems = [...displayItems, ...displayItems, ...displayItems, ...displayItems];

  return (
    <div className="w-full glass-card overflow-hidden h-12 flex items-center px-4 font-mono text-xs select-none">
      {/* Live Label Status Indicator */}
      <div className="flex items-center gap-2 border-r border-white/10 pr-4 mr-4 flex-shrink-0 text-white/50">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
        </span>
        <span className="tracking-widest font-semibold uppercase text-[10px]">GOAL TICKER</span>
      </div>

      {/* Marquee Body */}
      <div className="marquee-container flex-grow overflow-hidden relative">
        <div className="marquee-track flex gap-12 items-center text-zinc-300">
          {repeatedItems.map((goal, idx) => (
            <div key={`${goal.id}-${idx}`} className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-[#e07658] font-bold">
                {activeGoals.length > 0 ? `▲ G[0${(idx % activeGoals.length) + 1}]` : "◆"}
              </span>
              <span className="tracking-wider uppercase font-medium">
                {goal.text}
              </span>
            </div>
          ))}
        </div>
        
        {/* Soft edge blur overlays */}
        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#050506]/30 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#050506]/30 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
