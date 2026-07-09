"use client";

import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          className: "text-sm",
        }}
      />
    </>
  );
}
