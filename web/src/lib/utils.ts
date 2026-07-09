import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getURL() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    "http://localhost:3000";

  return url.startsWith("http") ? url : `https://${url}`;
}
