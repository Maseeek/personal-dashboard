import { createClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const requestUrl = new URL(request.url);
  const next = requestUrl.searchParams.get("next") || "/";

  // Google OAuth scopes for health/fitness tracking and calendar events
  const scopes = [
    "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
    "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    "https://www.googleapis.com/auth/calendar.readonly"
  ].join(" ");

  // Trigger Supabase-managed Google OAuth redirection
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback/google?next=${next}`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      scopes,
    },
  });

  if (error) {
    console.error("Google OAuth initialization error:", error);
    return NextResponse.redirect(`${requestUrl.origin}/?error=oauth_init_failed`);
  }

  // Redirect user to Google sign-in consent page
  return NextResponse.redirect(data.url);
}
