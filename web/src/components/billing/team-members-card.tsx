"use client";

import { Users } from "lucide-react";

import { UpgradeGate } from "@/components/billing/upgrade-gate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TeamMembersCardProps = {
  enabled: boolean;
  memberCount: number;
  memberLimit: number | null;
};

export function TeamMembersCard({
  enabled,
  memberCount,
  memberLimit,
}: TeamMembersCardProps) {
  if (!enabled) {
    return (
      <UpgradeGate
        feature="team_members"
        title="Invite your team"
        description="Starter includes up to 3 team members. Pro includes unlimited seats."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team members
        </CardTitle>
        <CardDescription>
          Invite teammates to help manage compliance across your shops.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {memberCount} active member{memberCount === 1 ? "" : "s"}
          {memberLimit !== null ? ` · ${memberLimit} seat limit` : " · Unlimited seats"}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Team invitations are included in your plan. During the pilot, contact
          support to add teammates — self-serve invites are coming soon.
        </p>
      </CardContent>
    </Card>
  );
}
