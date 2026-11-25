import type { APIRoute } from "astro";
import { validateOrgEmail } from "@hf/shared/lib/validateEmail";
import { LEAD_STEPS, leadFit } from "../../lib/leadQuestions";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ ok: false, reason: "Content-Type must be application/json" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ ok: false, reason: "Invalid request payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { name, company, email, title, orgType, facilities, role, priorities, challenge, timeline, message, socialScore } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return new Response(
        JSON.stringify({ ok: false, reason: "Missing full name." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!company || typeof company !== "string" || !company.trim()) {
      return new Response(
        JSON.stringify({ ok: false, reason: "Missing organization name." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ ok: false, reason: "Missing work email." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const emailCheck = validateOrgEmail(email);
    if (!emailCheck.ok) {
      return new Response(
        JSON.stringify({ ok: false, reason: emailCheck.reason }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate step answers
    const allQuestions = LEAD_STEPS.flat();
    for (const q of allQuestions) {
      const v = body[q.id];
      if (q.type === "multi") {
        if (!Array.isArray(v) || v.length === 0 || !v.every(x => q.opts.includes(x))) {
          return new Response(
            JSON.stringify({ ok: false, reason: `Invalid answer for: ${q.label}` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        if (!v || typeof v !== "string" || !q.opts.includes(v)) {
          return new Response(
            JSON.stringify({ ok: false, reason: `Invalid answer for: ${q.label}` }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    const fit = leadFit({ timeline, facilities, role });

    const lead = {
      timestamp: new Date().toISOString(),
      kind: "lead",
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      title: typeof title === "string" ? title.trim() : "",
      orgType,
      facilities: typeof facilities === "string" ? facilities : "",
      role: typeof role === "string" ? role : "",
      priorities: Array.isArray(priorities) ? priorities.join(", ") : (typeof priorities === "string" ? priorities : ""),
      challenge: typeof challenge === "string" ? challenge : "",
      timeline,
      socialScore: typeof socialScore === "string" ? socialScore : "",
      fit,
      message: typeof message === "string" ? message.trim() : ""
    };

    // Forward to Google Apps Script Webhook (compulsory)
    const webhookUrl =
      (import.meta.env && (import.meta.env.GOOGLE_SHEETS_WEBHOOK_URL as string)) ||
      (typeof process !== "undefined" && process.env?.GOOGLE_SHEETS_WEBHOOK_URL) ||
      (typeof process !== "undefined" && process.env?.SHEET_WEBHOOK_URL) ||
      "";

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: "Google Sheets integration is not configured. The GOOGLE_SHEETS_WEBHOOK_URL environment variable is required to record leads."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    let gasData: any = null;
    try {
      const gasRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        redirect: "follow"
      });
      gasData = await gasRes.json().catch(() => null);

      if (!gasRes.ok || !gasData || gasData.result !== "success") {
        const errorMsg = gasData?.error || "Google Sheets failed to confirm the saved lead.";
        return new Response(
          JSON.stringify({ ok: false, reason: errorMsg }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (err: any) {
      return new Response(
        JSON.stringify({
          ok: false,
          reason: "Unable to connect to Google Sheets webhook: " + (err?.message || "network error")
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        lead: {
          ...lead,
          sheet: gasData.sheet || "Leads",
          rowNumber: gasData.rowNumber
        },
        recordedToSheet: true
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, reason: err?.message || "Server error processing lead submission." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
