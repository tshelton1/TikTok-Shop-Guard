"use client";

import { CheckCircle2, Circle, ScanSearch, Settings, Shield, X } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tsg_onboarding_dismissed";

const STEPS = [
  {
    id: "scan",
    label: "Run your first listing scan",
    description: "Check a product title and description for policy issues.",
    href: "/dashboard/scans",
    icon: ScanSearch,
  },
  {
    id: "violations",
    label: "Review open violations",
    description: "See flagged listings and start an appeal workflow.",
    href: "/dashboard/appeals",
    icon: Shield,
  },
  {
    id: "settings",
    label: "Check your plan & billing",
    description: "View usage limits and upgrade when you're ready.",
    href: "/dashboard/settings",
    icon: Settings,
  },
] as const;

type OnboardingChecklistProps = {
  shopId?: string;
  completedSteps?: {
    scan?: boolean;
    violations?: boolean;
    settings?: boolean;
  };
};

function subscribeToOnboarding(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOnboardingDismissed() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerOnboardingDismissed() {
  return true;
}

export function OnboardingChecklist({
  shopId,
  completedSteps = {},
}: OnboardingChecklistProps) {
  const dismissed = useSyncExternalStore(
    subscribeToOnboarding,
    getOnboardingDismissed,
    getServerOnboardingDismissed,
  );
  const [hidden, setHidden] = useState(false);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "true");
    setHidden(true);
    window.dispatchEvent(new Event("storage"));
  }

  if (dismissed || hidden) {
    return null;
  }

  const shopQuery = shopId ? `?shop=${shopId}` : "";
  const completedCount = STEPS.filter(
    (step) => completedSteps[step.id as keyof typeof completedSteps],
  ).length;

  return (
    <Card className="mb-6 border-brand/20 bg-brand/5">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg">Welcome to TikTok Shop Guard</CardTitle>
          <CardDescription>
            {completedCount === 0
              ? "Follow these steps to explore the pilot — about 5 minutes."
              : `${completedCount} of ${STEPS.length} steps complete. Keep going!`}
          </CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={dismiss}
          aria-label="Dismiss onboarding checklist"
          className="shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const done = completedSteps[step.id as keyof typeof completedSteps];

          return (
            <Link
              key={step.id}
              href={`${step.href}${shopQuery}`}
              className={cn(
                "flex items-start gap-3 rounded-lg border bg-background p-4 transition-colors hover:bg-muted/40",
                done && "border-emerald-200 bg-emerald-50/40",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-brand" />
                  {step.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-xs font-medium",
                    done ? "text-emerald-700" : "text-muted-foreground",
                  )}
                >
                  {done ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </>
                  ) : (
                    <>
                      <Circle className="h-3 w-3" />
                      Not started
                    </>
                  )}
                </p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
