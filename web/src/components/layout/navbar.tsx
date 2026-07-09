import Link from "next/link";

import { Logo } from "@/components/shared/logo";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/#features", label: "Features" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user?.email ? (
            <UserMenu email={user.email} showDashboardLink />
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="brand">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
