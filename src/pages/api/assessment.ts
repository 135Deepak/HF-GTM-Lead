import type { APIRoute } from "astro";
import { validateOrgEmail } from "../../lib/validateEmail";
import { QUESTIONS, computeScore } from "../../lib/scoring";

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

    const { name, company, email, title, answers } = body;

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

    if (
      !Array.isArray(answers) ||
      answers.length !== QUESTIONS.length ||
      !answers.every(x => typeof x === "number" && x >= 0 && x <= 3)
    ) {
      return new Response(
        JSON.stringify({ ok: false, reason: "Invalid or incomplete assessment answers." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { score, band, byCat } = computeScore(answers);
    const cats = Object.fromEntries(byCat.map(c => [c.cat.toLowerCase(), c.pct]));

    const row = {
      timestamp: new Date().toISOString(),
      kind: "assessment",
      name: name.trim(),
      email: email.trim(),
      company: company.trim(),
      title: typeof title === "string" ? title.trim() : "",
      score,
      band: band.label,
      ...cats,
      answers: answers.join(",")
    };

    // Forward to Google Apps Script Webhook if configured
    const webhookUrl =
      (typeof process !== "undefined" && process.env?.GOOGLE_SHEETS_WEBHOOK_URL) ||
      (typeof process !== "undefined" && process.env?.SHEET_WEBHOOK_URL) ||
      "";

    let webhookSuccess = false;
    if (webhookUrl) {
      try {
        const gasRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row)
        });
        webhookSuccess = gasRes.ok;
      } catch (err) {
        console.warn("[Google Apps Script] Webhook delivery notice:", err);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, row, recordedToSheet: webhookSuccess }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, reason: err?.message || "Server error processing assessment." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
