-- Supabase Schema for Live Personal Life Dashboard

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS PROFILE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow users to update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. OAUTH CREDENTIALS (for Google & Fitbit APIs)
CREATE TABLE IF NOT EXISTS public.oauth_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'google' or 'fitbit'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider)
);

ALTER TABLE public.oauth_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own credentials" ON public.oauth_credentials 
    FOR ALL USING (auth.uid() = user_id);

-- 3. DAILY HEALTH METRICS (from Fitbit Air)
CREATE TABLE IF NOT EXISTS public.metrics_daily (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    steps INTEGER DEFAULT 0 NOT NULL,
    sleep_duration_minutes INTEGER DEFAULT 0 NOT NULL,
    sleep_quality_score INTEGER,
    avg_heart_rate INTEGER,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

ALTER TABLE public.metrics_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own daily metrics" ON public.metrics_daily 
    FOR ALL USING (auth.uid() = user_id);

-- 4. CALENDAR EVENTS (from Google Calendar)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    external_event_id TEXT, -- ID from Google Calendar
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    is_gym_session BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, external_event_id)
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own calendar events" ON public.calendar_events 
    FOR ALL USING (auth.uid() = user_id);

-- 5. FINANCIAL TRANSACTIONS (Income/Expense Ledger)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Food', 'Transport', 'Salary', 'Gym'
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL, -- Positive for both; type determines direction
    transaction_type TEXT CHECK (transaction_type IN ('income', 'expense')) NOT NULL,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own financial transactions" ON public.financial_transactions 
    FOR ALL USING (auth.uid() = user_id);

-- 6. GOALS / TODO ITEMS
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    position INTEGER DEFAULT 0 NOT NULL, -- Ordering weight
    category TEXT, -- e.g., 'career', 'health', 'personal'
    target_date DATE,
    is_queued BOOLEAN DEFAULT false NOT NULL, -- For the active ⚡ queue
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to manage own goals" ON public.goals 
    FOR ALL USING (auth.uid() = user_id);

-- 7. PROFILE AUTO-CREATION TRIGGER
-- Automatically create profile row when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
