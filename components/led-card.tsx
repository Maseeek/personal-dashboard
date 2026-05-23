"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db";

interface LEDCardProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isEditing?: boolean;
  colSpan?: number;
  rowSpan?: number;
  onCycleColSpan?: () => void;
  onCycleRowSpan?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

interface Mood {
  id?: number;
  name: string;
  uri: string;
  hex_color: string;
  is_song: boolean;
}

const DEFAULT_MOODS: Mood[] = [
  { name: "hype", uri: "spotify:playlist:0hBSTE8N0qNbBrXyVH5BUm", hex_color: "7e070503ff000010ef", is_song: false },
  { name: "chill", uri: "spotify:playlist:3TKkZAP3k6FVMfnFqUMvpL", hex_color: "7e0705030000ff10ef", is_song: false },
  { name: "party", uri: "spotify:playlist:37i9dQZF1EIcsHAaTPt2VN", hex_color: "7e070503ff00ff10ef", is_song: false },
  { name: "italy", uri: "spotify:playlist:2QWl1UykngbHZoeoJsSP90", hex_color: "7e07050300ff0010ef", is_song: false },
  { name: "summer", uri: "spotify:playlist:2qGRLh923i3eV11NFy0LSl", hex_color: "7e070503ff450010ef", is_song: false }
];

const PRESETS = [
  { name: "Spotify Green", hex: "#1DB954" },
  { name: "Hype Red", hex: "#ff0000" },
  { name: "Ice Blue", hex: "#00f0ff" },
  { name: "Sunset Orange", hex: "#ff5e00" },
  { name: "Silk Gold", hex: "#ffd700" },
  { name: "Prince Purple", hex: "#a855f7" }
];

export default function LEDCard({
  isCollapsed = false,
  onToggleCollapse,
  isEditing = false,
  colSpan = 1,
  rowSpan = 1,
  onCycleColSpan,
  onCycleRowSpan,
  dragHandleProps
}: LEDCardProps) {
  // Settings & Host IP configuration
  const [ledHost, setLedHost] = useState("127.0.0.1");
  const [ledPort, setLedPort] = useState(5000);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [inputHost, setInputHost] = useState("");
  const [inputPort, setInputPort] = useState(5000);

  // Connection & API state
  const [isOnline, setIsOnline] = useState(false);
  const [bleConnected, setBleConnected] = useState(false);
  const [spotifyPlaying, setSpotifyPlaying] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState("Unknown");
  const [activeColor, setActiveColor] = useState("#1DB954");
  const [moods, setMoods] = useState<Mood[]>(DEFAULT_MOODS);
  const [activeMood, setActiveMood] = useState("");

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load Host IP configuration
  useEffect(() => {
    const timer = setTimeout(() => {
      const userSettings = db.getSettings();
      const host = userSettings.ledHost || "127.0.0.1";
      const port = userSettings.ledPort || 5000;
      setLedHost(host);
      setLedPort(port);
      setInputHost(host);
      setInputPort(port);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const baseUrl = `http://${ledHost}:${ledPort}`;

  // Poll status & fetch moods
  useEffect(() => {
    // Initial fetch of moods
    const fetchMoods = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/moods`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setMoods(data);
          }
        }
      } catch (err) {
        console.warn("Failed to load custom moods from Flask API, using defaults:", err);
        setMoods(DEFAULT_MOODS);
      }
    };

    const pollStatus = async () => {
      try {
        const res = await fetch(`${baseUrl}/status`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          setIsOnline(true);
          setBleConnected(data.ble_connected || false);
          setSpotifyPlaying(data.playing || false);
          setSpotifyTrack(data.title || "Paused");
          
          // Parse back hex color if available
          if (data.color) {
            const rgbMatch = data.color.match(/7e070503([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})10ef/i);
            if (rgbMatch) {
              setActiveColor(`#${rgbMatch[1]}${rgbMatch[2]}${rgbMatch[3]}`);
            }
          }
        } else {
          setIsOnline(false);
          setBleConnected(false);
        }
      } catch {
        setIsOnline(false);
        setBleConnected(false);
      }
    };

    fetchMoods();
    pollStatus();

    // Setup polling every 5 seconds
    pollIntervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [baseUrl]);

  // Save configurations
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputHost.trim()) return;

    setLedHost(inputHost.trim());
    setLedPort(inputPort);

    const userSettings = db.getSettings();
    db.saveSettings({
      ...userSettings,
      ledHost: inputHost.trim(),
      ledPort: inputPort
    });
    setIsEditingSettings(false);
  };

  // Convert Hex color to RGB
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Handle color change
  const handleSendColor = async (hex: string) => {
    setActiveColor(hex);
    setActiveMood("");
    const { r, g, b } = hexToRgb(hex);

    try {
      await fetch(`${baseUrl}/api/led/color`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r, g, b }),
        signal: AbortSignal.timeout(1500)
      });
    } catch (err) {
      console.error("Failed to send color command:", err);
    }
  };

  // Handle mood trigger
  const handleTriggerMood = async (moodName: string) => {
    setActiveMood(moodName);
    try {
      const res = await fetch(`${baseUrl}/${moodName}`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        // Immediate status refresh
        const statusRes = await fetch(`${baseUrl}/status`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setSpotifyPlaying(statusData.playing || false);
          setSpotifyTrack(statusData.title || "Playing");
        }
      }
    } catch (err) {
      console.error("Failed to trigger mood:", err);
    }
  };

  return (
    <div className={`glass-card flex flex-col w-full transition-all duration-300 ${isCollapsed ? "min-h-0 h-auto p-5" : "p-6 sm:p-8 min-h-[500px] h-full"}`}>
      <div className={isCollapsed ? "" : "flex flex-col flex-grow min-h-0 gap-6 w-full"}>
        {/* Header */}
        <div className="flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 text-left">
              <h2 className="text-sm uppercase tracking-widest text-zinc-400 font-mono font-medium">LED CONTROLS</h2>
              {!isCollapsed && (
                <p className="text-[10px] font-mono text-zinc-500">
                  {isOnline ? `SERVER: ${ledHost}:${ledPort}` : "SERVER: OFFLINE"}
                </p>
              )}
            </div>
            {isCollapsed && (
              <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-400">
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? (bleConnected ? "bg-emerald-400" : "bg-amber-400") : "bg-rose-500 animate-pulse"}`} />
                <span>
                  {isOnline 
                    ? (bleConnected 
                        ? `Connected • Mood: ${activeMood || "Manual"}` 
                        : "Disconnected")
                    : "Offline"}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                onClick={() => setIsEditingSettings(!isEditingSettings)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
                title="Configure Host IP"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                </svg>
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
            {isEditingSettings ? (
              /* Settings configuration */
              <form onSubmit={handleSaveSettings} className="w-full flex-grow flex flex-col justify-center gap-4 py-4 z-10 font-mono text-xs max-w-[240px] mx-auto shrink-0">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-zinc-500 uppercase text-[9px]">Server IP Address</label>
                  <input
                    type="text"
                    value={inputHost}
                    onChange={(e) => setInputHost(e.target.value)}
                    placeholder="e.g. 192.168.1.100"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/80 transition-all font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-zinc-500 uppercase text-[9px]">Server Port</label>
                  <input
                    type="number"
                    value={inputPort}
                    onChange={(e) => setInputPort(parseInt(e.target.value) || 5000)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500/80 transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#e07658] text-black font-bold uppercase py-2 rounded-xl hover:bg-orange-400 transition-all text-[10px]"
                >
                  Save Settings
                </button>
              </form>
            ) : (
              /* Main Interface */
              <div className="flex flex-col flex-grow min-h-0 overflow-y-auto pr-1 gap-4 py-1">
                {/* Connection Status & Spotify Widget */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 shrink-0">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">HARDWARE / BLE STATUS</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? (bleConnected ? "bg-emerald-400" : "bg-amber-400") : "bg-rose-500 animate-pulse"}`} />
                      <span className="font-mono text-[10px] text-zinc-300 font-bold">
                        {isOnline ? (bleConnected ? "CONNECTED" : "DISCONNECTED") : "OFFLINE"}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex items-center gap-3">
                    <div className="text-xl flex-shrink-0 text-emerald-400 select-none animate-pulse">🎵</div>
                    <div className="flex flex-col overflow-hidden font-mono">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">SPOTIFY PLAYBACK</span>
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {spotifyPlaying ? spotifyTrack : "PAUSED // IDLE"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Moods Grid */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex-grow flex flex-col shrink-0">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider block mb-3">ACTIVE SPOTIFY MOODS</span>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {moods.map((mood) => {
                      const isActive = activeMood === mood.name;
                      return (
                        <button
                          key={mood.name}
                          onClick={() => handleTriggerMood(mood.name)}
                          disabled={!isOnline}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all duration-200 capitalize ${
                            isActive
                              ? "bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-[0_0_10px_rgba(224,118,88,0.25)]"
                              : "bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:border-white/10 disabled:opacity-40 disabled:pointer-events-none"
                          }`}
                        >
                          <span 
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ 
                              backgroundColor: mood.hex_color.startsWith("7e") 
                                ? `#${mood.hex_color.substr(8, 6)}` 
                                : mood.hex_color 
                            }}
                          />
                          <span className="truncate">{mood.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Customizer */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 shrink-0">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">MANUAL COLOR TUNER</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: activeColor }}
                      />
                      <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">{activeColor}</span>
                    </div>
                  </div>

                  {/* Preset Colors Grid */}
                  <div className="grid grid-cols-6 gap-2 mb-3">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleSendColor(preset.hex)}
                        disabled={!isOnline}
                        title={preset.name}
                        style={{ backgroundColor: preset.hex }}
                        className={`w-full aspect-square rounded-xl border transition-all ${
                          activeColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                            : "border-transparent hover:scale-105 hover:border-white/20 disabled:opacity-40"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Custom color picker */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2 font-mono text-xs">
                    <input
                      id="led-color-picker"
                      name="ledColorPicker"
                      type="color"
                      value={activeColor}
                      disabled={!isOnline}
                      onChange={(e) => handleSendColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="led-color-picker" className="text-[9px] text-zinc-500 uppercase cursor-pointer">PALETTE PICKER</label>
                      <span className="text-[10px] text-zinc-300">Click to choose custom tone</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Hardware Info */}
      {!isCollapsed && (
        <div className="font-mono text-[9px] text-zinc-600 border-t border-white/5 pt-4 text-center mt-4 uppercase shrink-0">
          DEVICE ID: BLE-RGB-STRIP • TARGET PROTOCOL: ELK-BLEDOM
        </div>
      )}
    </div>
  );
}
