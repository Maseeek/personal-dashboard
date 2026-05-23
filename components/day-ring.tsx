"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db";

interface DayRingProps {
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

export default function DayRing({
  isCollapsed = false,
  onToggleCollapse,
  isEditing: isEditingLayout = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps,
  className = ""
}: DayRingProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [settings, setSettings] = useState({
    awakeStartHour: 8,
    awakeEndHour: 24,
  });
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(24);

  // Load settings on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(new Date());
      const userSettings = db.getSettings();
      setSettings({
        awakeStartHour: userSettings.awakeStartHour,
        awakeEndHour: userSettings.awakeEndHour,
      });
      setStartHour(userSettings.awakeStartHour);
      setEndHour(userSettings.awakeEndHour);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!currentTime) {
    return (
      <div className="glass-card flex flex-col items-center justify-center p-6 sm:p-8 min-h-[340px]">
        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-[#e07658] animate-spin" />
      </div>
    );
  }

  const { awakeStartHour, awakeEndHour } = settings;
  const totalAwakeHours = awakeEndHour - awakeStartHour;

  // Calculate current progress
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentSecond = currentTime.getSeconds();
  
  const timeInDecimal = currentHour + currentMinute / 60 + currentSecond / 3600;
  
  let percentageElapsed = 0;
  let remainingSeconds = 0;

  if (timeInDecimal < awakeStartHour) {
    // Before awake window
    percentageElapsed = 0;
    remainingSeconds = totalAwakeHours * 3600;
  } else if (timeInDecimal >= awakeEndHour) {
    // After awake window
    percentageElapsed = 100;
    remainingSeconds = 0;
  } else {
    const elapsedHours = timeInDecimal - awakeStartHour;
    percentageElapsed = (elapsedHours / totalAwakeHours) * 100;
    remainingSeconds = Math.max(0, (awakeEndHour - timeInDecimal) * 3600);
  }

  // Format remaining time
  const remHrs = Math.floor(remainingSeconds / 3600);
  const remMins = Math.floor((remainingSeconds % 3600) / 60);
  const remSecs = Math.floor(remainingSeconds % 60);

  // SVG Circular math
  const radius = 80;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageElapsed / 100) * circumference;

  // Determine sun-cycle color spectrum
  const getSunCycleColor = (percent: number) => {
    if (percent < 25) {
      const hue = 45 - (percent / 25) * 10;
      return `hsl(${hue}, 90%, 60%)`;
    } else if (percent < 60) {
      const hue = 35 - ((percent - 25) / 35) * 15;
      return `hsl(${hue}, 90%, 55%)`;
    } else if (percent < 85) {
      const hue = 20 - ((percent - 60) / 25) * 15;
      return `hsl(${hue}, 85%, 50%)`;
    } else {
      const hue = 350 - ((percent - 85) / 15) * 80;
      return `hsl(${hue}, 80%, 55%)`;
    }
  };

  const ringColor = getSunCycleColor(percentageElapsed);

  // Formatting clock display
  const padZero = (n: number) => String(n).padStart(2, "0");
  const clockString = `${padZero(currentHour)}:${padZero(currentMinute)}:${padZero(currentSecond)}`;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (startHour >= endHour || startHour < 0 || endHour > 24) return;

    const userSettings = db.getSettings();
    const updated = {
      ...userSettings,
      awakeStartHour: startHour,
      awakeEndHour: endHour,
    };
    db.saveSettings(updated);
    setSettings({
      awakeStartHour: startHour,
      awakeEndHour: endHour,
    });
    setIsEditingSettings(false);
  };

  return (
    <div className={`glass-card flex flex-col w-full relative overflow-hidden transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[380px] h-full"} ${className}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-grow min-h-0 gap-6 items-center w-full justify-between"}>
        <div className="flex justify-between items-start z-10 w-full shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 text-left">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">DAY PROGRESS // AWAKE CYCLE</h2>
            {!isCollapsed && <p className="text-[10px] font-mono text-zinc-500">TARGET: {padZero(awakeStartHour)}:00 - {padZero(awakeEndHour)}:00</p>}
          </div>
          {isCollapsed && (
            <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
              <span className="text-[#e07658] font-bold">{clockString}</span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-bold">{percentageElapsed.toFixed(1)}%</span>
              <span className="text-zinc-600">|</span>
              <span>{padZero(remHrs)}h remaining</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isCollapsed && (
            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="text-zinc-500 hover:text-white transition-colors p-1"
              title="Configure Awake Cycle"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
            </button>
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

          {/* Collapse Toggle */}
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
          {isEditingSettings ? (
            /* Settings panel */
            <form onSubmit={handleSaveSettings} className="w-full flex-grow flex flex-col justify-center gap-4 py-4 z-10 font-mono text-xs max-w-[240px] mx-auto shrink-0">
              <div className="flex flex-col gap-1 text-left">
                <label htmlFor="start-hour-range" className="text-zinc-500 uppercase text-[9px]">Cycle Start Hour</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="start-hour-range"
                    name="startHourRange"
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={startHour}
                    onChange={(e) => setStartHour(parseInt(e.target.value))}
                    className="flex-grow accent-[#e07658] cursor-pointer"
                  />
                  <span className="w-12 text-right font-bold text-white">{padZero(startHour)}:00</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label htmlFor="end-hour-range" className="text-zinc-500 uppercase text-[9px]">Cycle End Hour</label>
                <div className="flex gap-2 items-center">
                  <input
                    id="end-hour-range"
                    name="endHourRange"
                    type="range"
                    min="13"
                    max="24"
                    step="1"
                    value={endHour}
                    onChange={(e) => setEndHour(parseInt(e.target.value))}
                    className="flex-grow accent-[#e07658] cursor-pointer"
                  />
                  <span className="w-12 text-right font-bold text-white">{padZero(endHour)}:00</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingSettings(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-zinc-300 py-2 rounded-xl transition-all"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="flex-grow-[2] bg-[#e07658] text-black font-bold py-2 rounded-xl hover:bg-orange-400 transition-all"
                >
                  SAVE CYCLE
                </button>
              </div>
            </form>
          ) : (
            /* Circular Day Ring Progress Display */
            <>
              <div className="relative my-4 flex items-center justify-center select-none z-10 shrink-0">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    className="stroke-white/5 fill-transparent"
                    strokeWidth={strokeWidth}
                  />
                  <defs>
                    <filter id="ring-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="transparent"
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ 
                      transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease",
                      filter: "url(#ring-glow)" 
                    }}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-2xl font-bold tracking-tight text-white mb-0.5">{clockString}</span>
                  <span className="text-xl font-medium" style={{ color: ringColor }}>
                    {percentageElapsed.toFixed(1)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-zinc-500 mt-1">elapsed</span>
                </div>
              </div>

              <div className="font-mono text-xs z-10 shrink-0">
                {percentageElapsed >= 100 ? (
                  <span className="text-indigo-400 font-bold uppercase tracking-wider animate-pulse">AWAKE CYCLE CONCLUDED // TIME TO REST</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="text-zinc-300">
                      REMAINING: <span className="font-bold text-white">{padZero(remHrs)}h {padZero(remMins)}m {padZero(remSecs)}s</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      UNTIL SLEEP CYCLE START ({padZero(awakeEndHour)}:00)
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div 
            className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[70px] opacity-10 pointer-events-none transition-all duration-500"
            style={{ backgroundColor: ringColor }}
          />
        </>
      )}
      </div>
    </div>
  );
}
