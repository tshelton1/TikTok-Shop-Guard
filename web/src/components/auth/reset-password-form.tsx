"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { showError, showSuccess } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import {
  hasFieldErrors,
  validateResetPasswordForm,
  type AuthFieldErrors,
} from "@/lib/validation/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

  useEffect(() => {
    let cancelled = false;

    async function establishRecoverySession() {
      setPreparing(true);
      setError(null);

      const client = createClient();

      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const tokenHash = url.searchParams.get("token_hash");
        const type = url.searchParams.get("type");

        if (code) {
          const { error: exchangeError } =
            await client.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          window.history.replaceState({}, document.title, "/auth/update-password");
        } else if (tokenHash && type === "recovery") {
          const { error: verifyError } = await client.auth.verifyOtp({
            token_hash: tokenHash,
            type: "recovery",
          });

          if (verifyError) {
            throw verifyError;
          }

          window.history.replaceState({}, document.title, "/auth/update-password");
        }

        const {
          data: { session },
        } = await client.auth.getSession();

        if (!session) {
          throw new Error(
            "Open the password reset link from your email to continue.",
          );
        }

        if (!cancelled) {
          setSessionReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error
              ? err.message
              : "Could not verify your reset link.";
          setError(message);
          showError(message);
        }
      } finally {
        if (!cancelled) {
          setPreparing(false);
        }
      }
    }

    void establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const validation = validateResetPasswordForm(password, confirmPassword);
    if (hasFieldErrors(validation)) {
      setFieldErrors(validation);
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;
      showSuccess("Password updated successfully.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  if (preparing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-4 text-sm text-muted-foreground">
          Verifying your reset link…
        </p>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-foreground">Link expired</h1>
        <p className="text-sm text-muted-foreground">
          {error ?? "This password reset link is invalid or has expired."}
        </p>
        <Button asChild variant="brand" className="w-full">
          <a href="/forgot-password">Request a new reset link</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password for your account.
        </p>
      </div>

      <Form onSubmit={handleSubmit}>
        <FormItem>
          <FormLabel htmlFor="password">New password</FormLabel>
          <FormControl>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              minLength={8}
              required
            />
          </FormControl>
          {fieldErrors.password && (
            <FormMessage>{fieldErrors.password}</FormMessage>
          )}
        </FormItem>

        <FormItem>
          <FormLabel htmlFor="confirmPassword">Confirm password</FormLabel>
          <FormControl>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              minLength={8}
              required
            />
          </FormControl>
          {fieldErrors.confirmPassword && (
            <FormMessage>{fieldErrors.confirmPassword}</FormMessage>
          )}
        </FormItem>

        {error && <FormMessage>{error}</FormMessage>}

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update password"}
        </Button>
      </Form>
    </div>
  );
}
