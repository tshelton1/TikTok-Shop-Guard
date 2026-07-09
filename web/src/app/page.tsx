import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Shield,
  Zap,
} from "lucide-react";

import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

const features = [
  {
    icon: Shield,
    title: "Policy compliance",
    description:
      "Scan TikTok Shop listings against platform policies before violations impact revenue.",
  },
  {
    icon: Bell,
    title: "Instant alerts",
    description:
      "Get notified when listings, images, or claims put your shop at risk.",
  },
  {
    icon: BarChart3,
    title: "Risk dashboard",
    description:
      "Track compliance scores, flagged items, and remediation steps in one place.",
  },
  {
    icon: Zap,
    title: "Appeal workflow",
    description:
      "Document violations and manage appeals with a structured B2B workflow.",
  },
];

const stats = [
  { value: "98%", label: "Issues caught early" },
  { value: "4.2x", label: "Faster remediation" },
  { value: "24/7", label: "Shop monitoring" },
];

export default function HomePage() {
  return (
    <PublicLayout>
      <section className="border-b bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-brand" />
              Built for TikTok Shop sellers
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Protect your shop before policies become penalties
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              {APP_NAME} monitors listings, flags compliance risks, and helps your
              team resolve issues before TikTok takes action.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild variant="brand" size="lg">
                <Link href="/signup">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/pricing">View pricing</Link>
              </Button>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Everything you need to stay compliant
            </h2>
            <p className="mt-4 text-muted-foreground">
              From first listing to scale, {APP_NAME} keeps your catalog aligned
              with TikTok Shop requirements.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title}>
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription className="text-base leading-7">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-12 text-center shadow-sm">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Ready to guard your shop?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join sellers who catch policy issues before they become account
            strikes.
          </p>
          <Button asChild variant="brand" size="lg" className="mt-8">
            <Link href="/signup">Create your account</Link>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
