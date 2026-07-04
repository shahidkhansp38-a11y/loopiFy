import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthApi = {
  getAuthorizationDetails: (
    id: string,
  ) => Promise<{ data: any | null; error: { message: string } | null }>;
  approveAuthorization: (
    id: string,
  ) => Promise<{ data: any | null; error: { message: string } | null }>;
  denyAuthorization: (
    id: string,
  ) => Promise<{ data: any | null; error: { message: string } | null }>;
};

function getOAuthApi(): OAuthApi | null {
  const anyAuth = (supabase.auth as unknown) as { oauth?: OAuthApi };
  return anyAuth.oauth ?? null;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const oauth = getOAuthApi();
      if (!oauth) {
        setError("This app is not yet configured to authorize OAuth clients.");
        return;
      }

      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }

      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    const oauth = getOAuthApi();
    if (!oauth) {
      setError("OAuth is not configured.");
      return;
    }
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 loopify-card-shadow text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Authorization error</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </main>
    );
  }

  const clientName = details.client?.name ?? "an app";

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border border-border/50 rounded-3xl p-8 loopify-card-shadow">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl loopify-gradient flex items-center justify-center loopify-shadow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">
          Connect {clientName} to LoopiFy
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          This lets {clientName} access your LoopiFy account and read your groups, lectures,
          assignments, and learning progress on your behalf.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            disabled={busy}
            onClick={() => decide(false)}
          >
            Deny
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl loopify-gradient text-primary-foreground"
            disabled={busy}
            onClick={() => decide(true)}
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : "Approve"}
          </Button>
        </div>
      </div>
    </main>
  );
}
