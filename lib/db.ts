import { 
  Goal, 
  FinancialTransaction, 
  HealthMetrics, 
  CalendarEvent, 
  DashboardSettings,
  initialGoals,
  initialTransactions,
  initialMetrics,
  initialEvents,
  initialSettings 
} from "./mock-data";

// Helper to check if window is defined (browser environment)
const isBrowser = () => typeof window !== "undefined";

// Custom keys for local storage
const KEYS = {
  GOALS: "dashboard_goals",
  FINANCES: "dashboard_finances",
  METRICS: "dashboard_metrics",
  EVENTS: "dashboard_events",
  SETTINGS: "dashboard_settings",
  TOMORROW_GOALS: "dashboard_tomorrow_goals"
};

export const db = {
  // --- GOALS ---
  getGoals(): Goal[] {
    if (!isBrowser()) return initialGoals;
    try {
      const data = localStorage.getItem(KEYS.GOALS);
      if (!data) {
        this.saveGoals(initialGoals);
        return initialGoals;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        this.saveGoals(initialGoals);
        return initialGoals;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading goals:", e);
      return initialGoals;
    }
  },

  saveGoals(goals: Goal[]): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.GOALS, JSON.stringify(goals || []));
    } catch (e) {
      console.error("Error saving goals:", e);
    }
  },

  // --- TOMORROW'S PLANNED GOALS ---
  getTomorrowGoals(): string[] {
    if (!isBrowser()) return [];
    try {
      const data = localStorage.getItem(KEYS.TOMORROW_GOALS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Error loading tomorrow goals:", e);
      return [];
    }
  },

  saveTomorrowGoals(goals: string[]): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.TOMORROW_GOALS, JSON.stringify(goals || []));
    } catch (e) {
      console.error("Error saving tomorrow goals:", e);
    }
  },

  // --- FINANCES ---
  getTransactions(): FinancialTransaction[] {
    if (!isBrowser()) return initialTransactions;
    try {
      const data = localStorage.getItem(KEYS.FINANCES);
      if (!data) {
        this.saveTransactions(initialTransactions);
        return initialTransactions;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        this.saveTransactions(initialTransactions);
        return initialTransactions;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading transactions:", e);
      return initialTransactions;
    }
  },

  saveTransactions(transactions: FinancialTransaction[]): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.FINANCES, JSON.stringify(transactions || []));
    } catch (e) {
      console.error("Error saving transactions:", e);
    }
  },

  // --- HEALTH METRICS ---
  getMetrics(): HealthMetrics {
    if (!isBrowser()) return initialMetrics;
    try {
      const data = localStorage.getItem(KEYS.METRICS);
      if (!data) {
        this.saveMetrics(initialMetrics);
        return initialMetrics;
      }
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== "object" || !parsed.sleepBreakdown) {
        this.saveMetrics(initialMetrics);
        return initialMetrics;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading metrics:", e);
      return initialMetrics;
    }
  },

  saveMetrics(metrics: HealthMetrics): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.METRICS, JSON.stringify(metrics || initialMetrics));
    } catch (e) {
      console.error("Error saving metrics:", e);
    }
  },

  // --- CALENDAR EVENTS ---
  getEvents(): CalendarEvent[] {
    if (!isBrowser()) return initialEvents;
    try {
      const data = localStorage.getItem(KEYS.EVENTS);
      if (!data) {
        this.saveEvents(initialEvents);
        return initialEvents;
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        this.saveEvents(initialEvents);
        return initialEvents;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading events:", e);
      return initialEvents;
    }
  },

  saveEvents(events: CalendarEvent[]): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.EVENTS, JSON.stringify(events || []));
    } catch (e) {
      console.error("Error saving events:", e);
    }
  },

  // --- SETTINGS ---
  getSettings(): DashboardSettings {
    if (!isBrowser()) return initialSettings;
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      if (!data) {
        this.saveSettings(initialSettings);
        return initialSettings;
      }
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== "object" || typeof parsed.awakeStartHour !== "number") {
        this.saveSettings(initialSettings);
        return initialSettings;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading settings:", e);
      return initialSettings;
    }
  },

  saveSettings(settings: DashboardSettings): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings || initialSettings));
    } catch (e) {
      console.error("Error saving settings:", e);
    }
  },

  // --- CARD LAYOUTS ---
  getLayout(): CardState[] {
    if (!isBrowser()) return defaultLayout;
    try {
      const data = localStorage.getItem("dashboard_layout");
      if (!data) {
        this.saveLayout(defaultLayout);
        return defaultLayout;
      }
      const parsed = JSON.parse(data) as CardState[];
      if (!Array.isArray(parsed)) {
        this.saveLayout(defaultLayout);
        return defaultLayout;
      }
      const missing = defaultLayout.filter(d => !parsed.some(p => p.id === d.id));
      if (missing.length > 0) {
        const merged = [...parsed, ...missing];
        this.saveLayout(merged);
        return merged;
      }
      return parsed;
    } catch (e) {
      console.error("Error loading layout:", e);
      this.saveLayout(defaultLayout);
      return defaultLayout;
    }
  },

  saveLayout(layout: CardState[]): void {
    if (!isBrowser()) return;
    try {
      localStorage.setItem("dashboard_layout", JSON.stringify(layout || defaultLayout));
    } catch (e) {
      console.error("Error saving layout:", e);
    }
  }
};

export interface CardState {
  id: string;
  colSpan: number; // 1, 2, 3
  rowSpan: number; // 1, 2
  isCollapsed: boolean;
}

export const defaultLayout: CardState[] = [
  { id: "todo", colSpan: 1, rowSpan: 1, isCollapsed: false },
  { id: "day-ring", colSpan: 1, rowSpan: 1, isCollapsed: false },
  { id: "finances", colSpan: 1, rowSpan: 1, isCollapsed: false },
  { id: "metrics", colSpan: 1, rowSpan: 1, isCollapsed: false },
  { id: "calendar", colSpan: 1, rowSpan: 1, isCollapsed: false },
  { id: "led-card", colSpan: 1, rowSpan: 1, isCollapsed: false }
];
