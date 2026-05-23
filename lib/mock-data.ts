export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  isQuickQueue?: boolean; // ⚡ Quick Queue indicator
  dateCreated: string;
}

export interface FinancialTransaction {
  id: string;
  description: string;
  category: string;
  amount: number; // positive for income, negative for expense
  date: string;
}

export interface HealthMetrics {
  steps: number;
  stepsGoal: number;
  sleepHours: number;
  sleepGoal: number;
  sleepBreakdown: {
    deep: number;
    light: number;
    rem: number;
  };
  avgHeartRate: number;
  restingHeartRate: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // e.g. "09:00"
  end: string;   // e.g. "10:00"
  category: "work" | "gym" | "social" | "other";
}

export interface DashboardSettings {
  awakeStartHour: number; // e.g. 8 (8:00 AM)
  awakeEndHour: number;   // e.g. 24 (12:00 AM / Midnight)
  monthlyIncomeGoal: number;
  monthlyExpenseLimit: number;
  ledHost?: string;
  ledPort?: number;
}

export const initialGoals: Goal[] = [
  { id: "g1", text: "Hydrate: Drink 3L water", completed: true, dateCreated: new Date().toISOString() },
  { id: "g2", text: "Run 5k in under 25 mins", completed: false, isQuickQueue: false, dateCreated: new Date().toISOString() },
  { id: "g3", text: "Read 15 pages of philosophy", completed: false, isQuickQueue: true, dateCreated: new Date().toISOString() },
  { id: "g4", text: "Work on personal-dashboard UI design", completed: true, dateCreated: new Date().toISOString() },
  { id: "g5", text: "100 pushups & 15 mins full-body stretch", completed: false, isQuickQueue: true, dateCreated: new Date().toISOString() },
  { id: "g6", text: "Meal prep healthy lunch for tomorrow", completed: false, dateCreated: new Date().toISOString() },
];

export const initialTransactions: FinancialTransaction[] = [
  { id: "t1", description: "Monthly gym membership", category: "Health", amount: -45.0, date: new Date().toISOString().split("T")[0] },
  { id: "t2", description: "Bi-weekly salary payout", category: "Income", amount: 2200.0, date: new Date().toISOString().split("T")[0] },
  { id: "t3", description: "Specialty coffee roast", category: "Food & Drinks", amount: -6.5, date: new Date().toISOString().split("T")[0] },
  { id: "t4", description: "Organic groceries pack", category: "Food & Drinks", amount: -112.4, date: new Date().toISOString().split("T")[0] },
  { id: "t5", description: "SaaS server hosting fee", category: "Utilities", amount: -15.0, date: new Date().toISOString().split("T")[0] },
];

export const initialMetrics: HealthMetrics = {
  steps: 8450,
  stepsGoal: 10000,
  sleepHours: 7.2,
  sleepGoal: 8.0,
  sleepBreakdown: {
    deep: 1.8,
    light: 4.1,
    rem: 1.3
  },
  avgHeartRate: 64,
  restingHeartRate: 58
};

export const initialEvents: CalendarEvent[] = [
  { id: "e1", title: "Daily standup & project review", start: "09:00", end: "09:45", category: "work" },
  { id: "e2", title: "Gym: Heavy Push Session", start: "12:00", end: "13:30", category: "gym" },
  { id: "e3", title: "Dashboard code sync meeting", start: "15:00", end: "16:00", category: "work" },
  { id: "e4", title: "Dinner with friends at local kitchen", start: "19:30", end: "21:00", category: "social" }
];

export const initialSettings: DashboardSettings = {
  awakeStartHour: 8,
  awakeEndHour: 24,
  monthlyIncomeGoal: 4000,
  monthlyExpenseLimit: 1500,
  ledHost: "127.0.0.1",
  ledPort: 5000
};
