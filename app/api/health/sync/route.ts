import { createClient, supabaseService } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Helper to refresh Google Access Token
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  if (!supabaseService) return null;

  // 1. Fetch credentials from database
  const { data: creds, error } = await supabaseService
    .from("oauth_credentials")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error || !creds) {
    console.warn("No Google OAuth credentials found for user:", userId);
    return null;
  }

  // 2. Check if token is expired (or close to expiring: buffer of 2 minutes)
  const expiresAt = new Date(creds.expires_at).getTime();
  const now = Date.now();
  const isExpired = expiresAt - now < 120 * 1000;

  if (!isExpired) {
    return creds.access_token;
  }

  // 3. Token is expired, refresh it
  if (!creds.refresh_token) {
    console.warn("Google OAuth access token is expired, but no refresh token is stored.");
    return null;
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: creds.refresh_token,
      grant_type: "refresh_token",
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Google token refresh failed:", errText);
      return null;
    }

    const tokenData = await response.json();
    const newAccessToken = tokenData.access_token;
    const newExpiresInSeconds = tokenData.expires_in || 3600;
    const newExpiresAt = new Date(Date.now() + newExpiresInSeconds * 1000).toISOString();

    // 4. Update new access token in database
    await supabaseService
      .from("oauth_credentials")
      .update({
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider", "google");

    return newAccessToken;
  } catch (refreshErr) {
    console.error("Error refreshing Google access token:", refreshErr);
    return null;
  }
}

export async function POST(request: Request) {
  // 1. Authenticate user session
  let supabaseClient;
  try {
    supabaseClient = await createClient();
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return NextResponse.json({ error: "database_not_configured" }, { status: 500 });
  }

  const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Fetch/Refresh access token
  const accessToken = await getGoogleAccessToken(user.id);
  if (!accessToken) {
    return NextResponse.json({ error: "need_auth", message: "Google account not connected or authorization expired." }, { status: 400 });
  }

  try {
    const today = new Date();
    // Default queries start from past 30 hours to safely encompass local day metrics
    const past30Hours = new Date(today.getTime() - 30 * 60 * 60 * 1000);
    const startIso = past30Hours.toISOString();

    // 3. Fetch Steps
    const stepsFilter = encodeURIComponent(`steps.interval.end_time >= "${startIso}"`);
    const stepsRes = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/steps/dataPoints?filter=${stepsFilter}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let totalSteps = 0;
    if (stepsRes.ok) {
      const stepsData = await stepsRes.json();
      if (Array.isArray(stepsData.dataPoints)) {
        // Sum steps that fall into today in the server's date (local mapping will filter on frontend)
        const todayStr = today.toISOString().split("T")[0];
        totalSteps = stepsData.dataPoints
          .filter((dp: any) => {
            const endTime = dp.steps?.interval?.endTime;
            return endTime && endTime.startsWith(todayStr);
          })
          .reduce((sum: number, dp: any) => sum + (dp.steps?.count || 0), 0);
      }
    } else {
      console.warn("Failed to fetch steps from Google Health API:", await stepsRes.text());
    }

    // 4. Fetch Sleep
    const sleepFilter = encodeURIComponent(`sleep.interval.end_time >= "${startIso}"`);
    const sleepRes = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints?filter=${sleepFilter}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let sleepHours = 0;
    let sleepBreakdown = { deep: 0, light: 0, rem: 0 };
    if (sleepRes.ok) {
      const sleepData = await sleepRes.json();
      if (Array.isArray(sleepData.dataPoints) && sleepData.dataPoints.length > 0) {
        // Get the latest sleep session
        const latestSleep = sleepData.dataPoints[sleepData.dataPoints.length - 1]?.sleep;
        if (latestSleep) {
          const totalMinutes = latestSleep.summary?.totalMinutesAsleep || 0;
          sleepHours = parseFloat((totalMinutes / 60).toFixed(1));

          const stagesSummary = latestSleep.stages?.stageSummary || [];
          let deepMins = 0;
          let lightMins = 0;
          let remMins = 0;

          stagesSummary.forEach((s: any) => {
            if (s.stage === "DEEP") deepMins = s.minutes || 0;
            else if (s.stage === "LIGHT") lightMins = s.minutes || 0;
            else if (s.stage === "REM") remMins = s.minutes || 0;
          });

          // If stage breakdowns are missing or zero but we have total minutes,
          // approximate breakdown (Deep ~20%, REM ~20%, Light ~60%)
          if (deepMins === 0 && lightMins === 0 && remMins === 0 && totalMinutes > 0) {
            deepMins = Math.round(totalMinutes * 0.20);
            remMins = Math.round(totalMinutes * 0.20);
            lightMins = totalMinutes - deepMins - remMins;
          }

          sleepBreakdown = {
            deep: parseFloat((deepMins / 60).toFixed(1)),
            light: parseFloat((lightMins / 60).toFixed(1)),
            rem: parseFloat((remMins / 60).toFixed(1)),
          };
        }
      }
    } else {
      console.warn("Failed to fetch sleep from Google Health API:", await sleepRes.text());
    }

    // 5. Fetch Heart Rate
    // Average HR from last 30 hours
    const hrFilter = encodeURIComponent(`heart_rate.sample_time.physical_time >= "${startIso}"`);
    const hrRes = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/heart-rate/dataPoints?filter=${hrFilter}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let avgHeartRate = 65; // Fallback average
    if (hrRes.ok) {
      const hrData = await hrRes.json();
      if (Array.isArray(hrData.dataPoints) && hrData.dataPoints.length > 0) {
        const sum = hrData.dataPoints.reduce((s: number, dp: any) => s + (dp.heartRate?.beatsPerMinute || 0), 0);
        avgHeartRate = Math.round(sum / hrData.dataPoints.length);
      }
    }

    // Resting HR
    const restingHrRes = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/daily-resting-heart-rate/dataPoints`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    let restingHeartRate = 60; // Fallback resting
    if (restingHrRes.ok) {
      const restingHrData = await restingHrRes.json();
      if (Array.isArray(restingHrData.dataPoints) && restingHrData.dataPoints.length > 0) {
        const latest = restingHrData.dataPoints[restingHrData.dataPoints.length - 1];
        restingHeartRate = latest.dailyRestingHeartRate?.beatsPerMinute || latest.heartRate?.beatsPerMinute || 60;
      }
    }

    const payload = {
      steps: totalSteps,
      stepsGoal: 10000,
      sleepHours,
      sleepGoal: 8.0,
      sleepBreakdown,
      avgHeartRate,
      restingHeartRate,
    };

    // 6. Cache metrics in Supabase metrics_daily table
    if (supabaseService) {
      const todayStr = today.toISOString().split("T")[0];
      await supabaseService
        .from("metrics_daily")
        .upsert({
          user_id: user.id,
          date: todayStr,
          steps: totalSteps,
          sleep_duration_minutes: Math.round(sleepHours * 60),
          avg_heart_rate: avgHeartRate,
          last_synced: new Date().toISOString(),
        }, {
          onConflict: "user_id,date",
        });
    }

    return NextResponse.json(payload);
  } catch (syncError) {
    console.error("Error executing health sync:", syncError);
    return NextResponse.json({ error: "sync_failed", message: "Failed fetching data from Google Health API." }, { status: 500 });
  }
}
