import React, { useState, useEffect } from "react";
import { LEAD_STEPS } from "../lib/leadQuestions";
import {
  getDetails,
  saveDetails,
  getLastScore
} from "../lib/visitorStore";
import type { VisitorDetails, ScoreData } from "../lib/visitorStore";
import { validateOrgEmail } from "../lib/validateEmail";
import { PersonalDetails } from "./PersonalDetails";
import { showToast } from "../lib/toast";

export const LeadForm: React.FC = () => {
  const [lstep, setLstep] = useState<number>(0);
  const [leadAns, setLeadAns] = useState<Record<string, any>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [details, setDetails] = useState<VisitorDetails>({
    name: "",
    company: "",
    email: "",
    title: "",
    source: "lead"
  });
  const [message, setMessage] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [leadError, setLeadError] = useState<string>("");
  const [leadSuccess, setLeadSuccess] = useState<boolean>(false);
  const [sheetRowData, setSheetRowData] = useState<any>(null);
  const [recordedToSheet, setRecordedToSheet] = useState<boolean>(false);

  const [lastScore, setLastScore] = useState<ScoreData | null>(null);

  useEffect(() => {
    const saved = getDetails();
    if (saved && saved.email) {
      setDetails({ ...saved, source: "lead" });
      setIsEditing(false);
      setHasHydrated(true);
    }
    const score = getLastScore();
    if (score) {
      setLastScore(score);
    }
  }, []);

  const handleFieldChange = (field: keyof VisitorDetails, val: string) => {
    setDetails(prev => ({ ...prev, [field]: val }));
    if (detailErrors[field]) {
      setDetailErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setLeadError("");
  };

  const handleSelectRadio = (qId: string, val: string) => {
    setLeadAns(prev => ({ ...prev, [qId]: val }));
    if (stepErrors[qId]) {
      setStepErrors(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleToggleMulti = (qId: string, val: string) => {
    const current = new Set<string>(leadAns[qId] || []);
    if (current.has(val)) {
      current.delete(val);
    } else {
      current.add(val);
    }
    const updated = Array.from(current);
    setLeadAns(prev => ({ ...prev, [qId]: updated }));
    if (stepErrors[qId] && updated.length > 0) {
      setStepErrors(prev => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    const errors: Record<string, string> = {};
    const questions = LEAD_STEPS[stepIndex];
    for (const q of questions) {
      const val = leadAns[q.id];
      if (!val || (Array.isArray(val) && val.length === 0)) {
        errors[q.id] = "Please choose an option";
      }
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextOrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lstep < 2) {
      if (validateStep(lstep)) {
        setLstep(lstep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    // Step 2 submission
    const errors: Record<string, string> = {};
    if (!details.name.trim()) errors.name = "Required";
    if (!details.company.trim()) errors.company = "Required";

    if (!details.email.trim()) {
      errors.email = "Required";
    } else {
      const emailCheck = validateOrgEmail(details.email);
      if (!emailCheck.ok) {
        errors.email = emailCheck.reason || "Invalid email";
      }
    }

    if (Object.keys(errors).length > 0) {
      setDetailErrors(errors);
      setIsEditing(true);
      return;
    }

    if (!consent) {
      showToast("Please agree to be contacted");
      return;
    }

    setSubmitting(true);
    setLeadError("");

    const score = getLastScore();
    const payload = {
      ...details,
      ...leadAns,
      message,
      socialScore: score ? `${score.score} (${score.label})` : ""
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setLeadError(data?.reason || "Failed to record consultation request in Google Sheets. Please try again.");
        setSubmitting(false);
        return;
      }

      saveDetails({ ...details, source: "lead" });
      setSheetRowData(data.lead);
      setRecordedToSheet(true);
      setLeadSuccess(true);
      showToast("Response recorded to Google Sheet");
    } catch {
      setLeadError("Unable to reach the server to save your request in Google Sheets. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setLeadAns({});
    setMessage("");
    setConsent(false);
    setStepErrors({});
    setDetailErrors({});
    setLeadError("");
    setLeadSuccess(false);
    setSheetRowData(null);
    setLstep(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const firstName = details.name.split(/\s+/)[0] || details.name;

  return (
    <div className="tool-layout">
      <div>
        {!leadSuccess && (
          <div className="stepper" id="leadStepper">
            <div className={`step ${lstep > 0 ? "done" : lstep === 0 ? "current" : ""}`}>
              <span>1. Your organization</span>
              <div className="bar">
                <i></i>
              </div>
            </div>
            <div className={`step ${lstep > 1 ? "done" : lstep === 1 ? "current" : ""}`}>
              <span>2. Your needs</span>
              <div className="bar">
                <i></i>
              </div>
            </div>
            <div className={`step ${lstep === 2 ? "current" : ""}`}>
              <span>3. Your details</span>
              <div className="bar">
                <i></i>
              </div>
            </div>
          </div>
        )}

        {!leadSuccess ? (
          <div className="panel" id="leadPanel">
            <form id="leadForm" onSubmit={handleNextOrSubmit} noValidate>
              <div className="panel-body">
                {/* Step 0: Your organization */}
                <div data-lstep="0" className={lstep === 0 ? "" : "hidden"}>
                  {LEAD_STEPS[0].map(q => (
                    <div className="qblock" data-q={q.id} key={q.id}>
                      <div className="qlabel">
                        {q.label}
                        {q.hint ? <span className="opt"> — {q.hint}</span> : null}
                      </div>

                      {q.type === "pills" ? (
                        <div className="pills">
                          {q.opts.map(o => {
                            const isSel = leadAns[q.id] === o;
                            return (
                              <button
                                key={o}
                                type="button"
                                className={`pill ${isSel ? "selected" : ""}`}
                                data-v={o}
                                aria-pressed={isSel}
                                onClick={() => handleSelectRadio(q.id, o)}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`options ${q.cols2 ? "cols2" : ""}`}>
                          {q.opts.map(o => {
                            const isSel = leadAns[q.id] === o;
                            return (
                              <button
                                key={o}
                                type="button"
                                className={`option ${isSel ? "selected" : ""}`}
                                data-v={o}
                                aria-pressed={isSel}
                                onClick={() => handleSelectRadio(q.id, o)}
                              >
                                <span className="radio"></span>
                                <span>{o}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {stepErrors[q.id] ? (
                        <div className="qerr">
                          <svg>
                            <use href="#i-alert" />
                          </svg>
                          {stepErrors[q.id]}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Step 1: Your needs */}
                <div data-lstep="1" className={lstep === 1 ? "" : "hidden"}>
                  {LEAD_STEPS[1].map(q => (
                    <div className="qblock" data-q={q.id} key={q.id}>
                      <div className="qlabel">
                        {q.label}
                        {q.hint ? <span className="opt"> — {q.hint}</span> : null}
                      </div>

                      {q.type === "pills" ? (
                        <div className="pills">
                          {q.opts.map(o => {
                            const isSel = leadAns[q.id] === o;
                            return (
                              <button
                                key={o}
                                type="button"
                                className={`pill ${isSel ? "selected" : ""}`}
                                data-v={o}
                                aria-pressed={isSel}
                                onClick={() => handleSelectRadio(q.id, o)}
                              >
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={`options ${q.cols2 ? "cols2" : ""}`}>
                          {q.opts.map(o => {
                            const isSel =
                              q.type === "multi"
                                ? (leadAns[q.id] || []).includes(o)
                                : leadAns[q.id] === o;
                            return (
                              <button
                                key={o}
                                type="button"
                                className={`option ${isSel ? "selected" : ""}`}
                                data-v={o}
                                aria-pressed={isSel}
                                onClick={() =>
                                  q.type === "multi"
                                    ? handleToggleMulti(q.id, o)
                                    : handleSelectRadio(q.id, o)
                                }
                              >
                                {q.type === "multi" ? (
                                  <span className="box">
                                    <svg>
                                      <use href="#i-check" />
                                    </svg>
                                  </span>
                                ) : (
                                  <span className="radio"></span>
                                )}
                                <span>{o}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {stepErrors[q.id] ? (
                        <div className="qerr">
                          <svg>
                            <use href="#i-alert" />
                          </svg>
                          {stepErrors[q.id]}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* Step 2: Your details */}
                <div data-lstep="2" className={lstep === 2 ? "" : "hidden"}>
                  <PersonalDetails
                    idPrefix="lead"
                    values={details}
                    onChange={handleFieldChange}
                    errors={detailErrors}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    hasHydratedFromStore={hasHydrated}
                  />

                  <div className="fields" style={{ marginTop: "var(--space-6)" }}>
                    <div className="f">
                      <label htmlFor="lead-message">
                        Anything else we should know?{" "}
                        <span style={{ color: "hsl(var(--muted-foreground))", fontWeight: 400 }}>
                          (optional)
                        </span>
                      </label>
                      <textarea
                        className="textarea"
                        id="lead-message"
                        name="message"
                        placeholder="Current clinical volume goals, software tools, target service lines…"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                      ></textarea>
                    </div>
                    <label className="checkline">
                      <input
                        type="checkbox"
                        id="lead-consent"
                        checked={consent}
                        onChange={e => setConsent(e.target.checked)}
                      />
                      I agree to HealthFoundry contacting me about this request. We never share your
                      details.
                    </label>
                  </div>

                  {leadError ? (
                    <div className="callout error" style={{ marginTop: "var(--space-5)" }}>
                      <svg>
                        <use href="#i-alert" />
                      </svg>
                      <span>{leadError}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="panel-foot">
                <button
                  className="hf-btn ghost"
                  type="button"
                  id="leadBack"
                  style={{ visibility: lstep === 0 ? "hidden" : "visible" }}
                  onClick={() => setLstep(Math.max(0, lstep - 1))}
                >
                  <svg>
                    <use href="#i-arrowLeft" />
                  </svg>
                  Back
                </button>
                <button
                  className={`hf-btn primary ${submitting ? "loading" : ""}`}
                  type="submit"
                  id="leadSubmit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner"></span>Recording response…
                    </>
                  ) : lstep === 2 ? (
                    <>
                      Submit consultation request
                      <svg>
                        <use href="#i-arrow" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Continue
                      <svg>
                        <use href="#i-arrow" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="panel" id="leadSuccess">
            <div className="success">
              <div className="badge">
                <svg>
                  <use href="#i-check" />
                </svg>
              </div>
              <h2>Response successfully recorded</h2>
              <p id="leadSuccessText">
                Thank you, {firstName}. Your growth consultation request has been recorded into the HealthFoundry Leads ledger. A specialist will review your request and reach out to {details.email} within one business day.
              </p>
              <div className="actions">
                <button className="hf-btn outline" onClick={handleResetForm} type="button">
                  Submit another response
                </button>
                <a className="hf-btn primary" href="/social-score">
                  Check your social score
                  <svg>
                    <use href="#i-arrow" />
                  </svg>
                </a>
              </div>
              {sheetRowData ? (
                <div className="payload" id="leadPayload">
                  {`// Confirmed saved to Google Sheet (${sheetRowData.sheet || "Leads"} tab, row #${sheetRowData.rowNumber || ""}):\n` +
                    `// "fit" is internal — computed server-side, never shown to the visitor\n` +
                    JSON.stringify(sheetRowData, null, 2)}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <aside className="tool-aside panel">
        <div className="panel-body">
          <div className="hf-overline">What happens next</div>
          <ul className="aside-list">
            <li>
              <svg>
                <use href="#i-check" />
              </svg>
              Same-day review by healthcare GTM strategists
            </li>
            <li>
              <svg>
                <use href="#i-check" />
              </svg>
              Dedicated specialist emails to schedule a 20-min strategy session
            </li>
            <li>
              <svg>
                <use href="#i-check" />
              </svg>
              Custom patient acquisition blueprint — no generic sales pitch
            </li>
          </ul>

          {lastScore ? (
            <div id="leadScoreCard">
              <div className="hf-overline" style={{ marginBottom: "var(--space-2)" }}>
                Attached to your request
              </div>
              <div className="mini-score">
                <span className="hf-num" id="miniScore">
                  {lastScore.score}
                </span>
                <div>
                  <div style={{ fontSize: "var(--fs-xs)", fontWeight: 500 }}>Social media score</div>
                  <span
                    className={`band ${lastScore.band}`}
                    id="miniBand"
                    style={{ marginTop: "4px", height: "22px" }}
                  >
                    {lastScore.label}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
};
