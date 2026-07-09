import { Shield } from "lucide-react";
import Link from "next/link";

import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showText?: boolean;
};

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <Shield className="h-4 w-4" />
      </span>
      {showText && (
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      )}
    </Link>
  );
}
