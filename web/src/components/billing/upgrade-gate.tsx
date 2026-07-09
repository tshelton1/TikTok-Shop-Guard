import { Lock, Sparkles } from "lucide-react";
import NextLink from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BillingFeature } from "@/lib/stripe";

const featureLabels: Record<BillingFeature, string> = {
  unlimited_scans: "Unlimited scans",
  appeals: "Appeal generator",
  document_uploads: "Document uploads",
  alerts: "Compliance alerts",
  team_members: "Team members",
};

type UpgradeGateProps = {
  feature: BillingFeature;
  title?: string;
  description?: string;
  children?: React.ReactNode;
};

export function UpgradeGate({
  feature,
  title,
  description,
  children,
}: UpgradeGateProps) {
  const label = featureLabels[feature];

  return (
    <Card className="border-dashed border-brand/30 bg-brand/5">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
          <Lock className="h-5 w-5 text-brand" />
        </div>
        <CardTitle>{title ?? `${label} is a paid feature`}</CardTitle>
        <CardDescription>
          {description ??
            `Upgrade to Starter or Pro to unlock ${label.toLowerCase()} and more compliance tools.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Button asChild variant="brand">
          <NextLink href="/pricing">
            <Sparkles className="h-4 w-4" />
            View plans
          </NextLink>
        </Button>
        {children}
      </CardContent>
    </Card>
  );
}
