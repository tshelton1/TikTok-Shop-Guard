import { NextResponse } from "next/server";

import { sendTransactionalEmail } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const to =
      typeof body.to === "string" && body.to.includes("@")
        ? body.to
        : user.email;

    if (!to) {
      return NextResponse.json({ error: "No recipient email" }, { status: 400 });
    }

    const subject =
      typeof body.subject === "string" && body.subject.trim()
        ? body.subject.trim()
        : "Welcome to TikTok Shop Guard";

    const html =
      typeof body.html === "string" && body.html.trim()
        ? body.html
        : `<p>Hi${user.user_metadata?.full_name ? ` ${user.user_metadata.full_name}` : ""},</p>
           <p>Your TikTok Shop Guard account is ready.</p>
           <p><strong>It works!</strong></p>`;

    const { data, error } = await sendTransactionalEmail({
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: error.message ?? "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Email route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send email",
      },
      { status: 500 },
    );
  }
}
