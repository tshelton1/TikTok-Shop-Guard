"use client";

import { useRouter } from "next/navigation";
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
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});

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
