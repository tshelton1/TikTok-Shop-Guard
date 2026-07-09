import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-center md:justify-between">
        <Logo />

        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Sign up
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
