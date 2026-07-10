"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/lib/constants";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import { showError, showSuccess } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import {
  hasFieldErrors,
  validateEmail,
  validateLoginForm,
  validateSignupForm,
  type AuthFieldErrors,
} from "@/lib/validation/auth";

type AuthMode = "login" | "signup" | "forgot";

type AuthFormProps = {
  mode: AuthMode;
};

const copy = {
  login: {
    title: "Welcome back",
    description: `Sign in to your ${APP_NAME} account.`,
    submit: "Sign in",
    alternate: "Don't have an account?",
    alternateHref: "/signup",
    alternateLabel: "Sign up",
  },
  signup: {
    title: "Create your account",
    description: "Start protecting your TikTok Shop in minutes.",
    submit: "Create account",
    alternate: "Already have an account?",
    alternateHref: "/login",
    alternateLabel: "Sign in",
  },
  forgot: {
    title: "Reset your password",
    description: "We'll email you a link to reset your password.",
    submit: "Send reset link",
    alternate: "Remember your password?",
    alternateHref: "/login",
    alternateLabel: "Sign in",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getSafeRedirectPath(searchParams.get("redirect"));
  const selectedPlan = searchParams.get("plan");
  const authError = searchParams.get("error");
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const authCallbackError =
    authError === "auth_callback_failed"
      ? "Sign-in link expired or is invalid. Please try again."
      : null;
  const displayError = error ?? authCallbackError;

  const content = copy[mode];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setFieldErrors({});

    const validation =
      mode === "login"
        ? validateLoginForm(email, password)
        : mode === "signup"
          ? validateSignupForm(email, password, fullName)
          : { email: undefined };

    if (mode !== "forgot" && hasFieldErrors(validation)) {
      setFieldErrors(validation);
      setLoading(false);
      return;
    }

    if (mode === "forgot") {
      const emailError = validateEmail(email);
      if (emailError) {
        setFieldErrors({ email: emailError });
        setLoading(false);
        return;
      }
    }

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        showSuccess("Welcome back!");
        router.push(redirect);
        router.refresh();
        return;
      }

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              shop_name: shopName.trim() || undefined,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;
        if (selectedPlan === "starter" || selectedPlan === "pro") {
          showSuccess("Account created. Choose your plan to continue.");
          router.push(`/pricing?plan=${selectedPlan}`);
          router.refresh();
          return;
        }
        setMessage("Check your email to confirm your account.");
        showSuccess("Account created. Check your email to confirm.");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/update-password`,
        },
      );
      if (resetError) throw resetError;
      setMessage("Password reset link sent. Check your inbox.");
      showSuccess("Password reset link sent.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      const friendly =
        message === "Failed to fetch"
          ? "Could not reach the auth server. Check your connection, disable blockers for supabase.co, and confirm NEXT_PUBLIC_SUPABASE_URL is set."
          : message.includes("Database error saving new user")
            ? "Account creation failed in the database (signup trigger). Run migration 009_canonicalize_profiles_auth.sql in the Supabase SQL editor, then try again."
            : message;
      setError(friendly);
      showError(friendly);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">{content.title}</h1>
        <p className="text-sm text-muted-foreground">{content.description}</p>
        {mode === "signup" && selectedPlan && selectedPlan !== "trial" && (
          <p className="text-sm text-brand">
            Selected plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </p>
        )}
      </div>

      <Form onSubmit={handleSubmit}>
        {mode === "signup" && (
          <>
            <FormItem>
              <FormLabel htmlFor="fullName">Full name</FormLabel>
              <FormControl>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Jane Seller"
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  required
                />
              </FormControl>
              {fieldErrors.fullName && (
                <FormMessage>{fieldErrors.fullName}</FormMessage>
              )}
            </FormItem>

            <FormItem>
              <FormLabel htmlFor="shopName">Shop name</FormLabel>
              <FormControl>
                <Input
                  id="shopName"
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="My TikTok Shop"
                />
              </FormControl>
              <p className="text-xs text-muted-foreground">
                Optional — we create a default shop for your workspace.
              </p>
            </FormItem>
          </>
        )}

        <FormItem>
          <FormLabel htmlFor="email">Email</FormLabel>
          <FormControl>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              required
            />
          </FormControl>
          {fieldErrors.email && <FormMessage>{fieldErrors.email}</FormMessage>}
        </FormItem>

        {mode !== "forgot" && (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel htmlFor="password">Password</FormLabel>
              {mode === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-brand hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <FormControl>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                aria-invalid={Boolean(fieldErrors.password)}
                minLength={8}
                required
              />
            </FormControl>
            {fieldErrors.password && (
              <FormMessage>{fieldErrors.password}</FormMessage>
            )}
            {mode === "signup" && !fieldErrors.password && (
              <p className="text-xs text-muted-foreground">
                At least 8 characters with a letter and a number.
              </p>
            )}
          </FormItem>
        )}

        {displayError && <FormMessage>{displayError}</FormMessage>}

        {message && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        )}

        <Button
          type="submit"
          variant="brand"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Please wait..." : content.submit}
        </Button>
      </Form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {content.alternate}{" "}
        <Link
          href={content.alternateHref}
          className="font-medium text-foreground hover:underline"
        >
          {content.alternateLabel}
        </Link>
      </p>
    </div>
  );
}
