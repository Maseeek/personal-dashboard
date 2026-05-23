import { createClient, supabaseService } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    const supabaseClient = await createClient();
    
    // Exchange the auth code for a Supabase user session
    const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/?error=auth_exchange_failed`);
    }

    const session = data?.session;
    if (session) {
      const { user, provider_token, provider_refresh_token } = session;

      if (supabaseService && provider_token) {
        // Access tokens from Google expire in 3600 seconds (1 hour)
        const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

        // Selective refresh token backup: if we didn't receive a refresh token in this specific code exchange,
        // search if we already have one stored so we don't overwrite it with null.
        let finalRefreshToken = provider_refresh_token;
        if (!finalRefreshToken) {
          const { data: existingCreds } = await supabaseService
            .from("oauth_credentials")
            .select("refresh_token")
            .eq("user_id", user.id)
            .eq("provider", "google")
            .maybeSingle();
          
          if (existingCreds?.refresh_token) {
            finalRefreshToken = existingCreds.refresh_token;
          }
        }

        // Upsert Google credentials into oauth_credentials
        const { error: upsertError } = await supabaseService
          .from("oauth_credentials")
          .upsert({
            user_id: user.id,
            provider: "google",
            access_token: provider_token,
            refresh_token: finalRefreshToken || null,
            expires_at: expiresAt,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "user_id,provider"
          });

        if (upsertError) {
          console.error("Error saving Google credentials to database:", upsertError);
        }
      }
    }
  }

  // Redirect the user back to the application home dashboard
  return NextResponse.redirect(`${origin}${next}`);
}
