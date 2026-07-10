import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Update password",
};

export default function UpdatePasswordPage() {
  return <ResetPasswordForm />;
}
