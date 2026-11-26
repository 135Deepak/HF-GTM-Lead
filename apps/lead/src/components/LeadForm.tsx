import React, { useState, useEffect } from "react";
import { LEAD_STEPS } from "../lib/leadQuestions";
import {
  getDetails,
  saveDetails,
  getLastScore
} from "@hf/shared/lib/visitorStore";
import type { VisitorDetails, ScoreData } from "@hf/shared/lib/visitorStore";
import { validateOrgEmail } from "@hf/shared/lib/validateEmail";
import { PersonalDetails } from "@hf/shared/components/PersonalDetails";
import { showToast } from "@hf/shared/lib/toast";

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

  const handleNextStep = () => {
    if (validateStep(lstep)) {
      setLstep(prev => prev + 1);
    }
  };

  const handleBackStep = () => {
    if (lstep > 0) {
      setLstep(prev => prev - 1);
      setLeadError("");
    }
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lstep < LEAD_STEPS.length) {
      handleNextStep();
      return;
    }

    // Step 2 validation
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

    setSubmitting(true);
    setLeadError("");

    const payload = {
      ...details,
      ...leadAns,
      message,
      socialScore: lastScore?.score ?? null
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setLeadError(data?.reason || "Something went wrong sending your request. Please try again.");
        setSubmitting(false);
        return;
      }
    } catch {
      setLeadError("Unable to reach the server to submit your request. Please check your connection and try again.");
      setSubmitting(false);
      return;
    }

    const savedDetails: VisitorDetails = { ...details, source: "lead" };
    saveDetails(savedDetails);
    setSubmitting(false);
    setLeadSuccess(true);
    showToast("Consultation request recorded to Google Sheet");
  };

  const handleResetForm = () => {
    setLeadAns({});
    setMessage("");
    setConsent(false);
    setLstep(0);
    setLeadSuccess(false);
    setLeadError("");
  };

  const firstName = details.name ? details.name.trim().split(" ")[0] : "there";
  const isDev = import.meta.env.DEV;
  const landingUrl = isDev ? "http://localhost:4321" : (import.meta.env.PUBLIC_LANDING_URL || "/");
  const socialScoreUrl = isDev ? "http://localhost:4322" : (import.meta.env.PUBLIC_SOCIAL_SCORE_URL || "/social-score");

  return (
    <div className="tool-layout">
      <div>
        <div className="stepper" id="leadStepper">
          <div className={`step ${lstep > 0 ? "done" : lstep === 0 ? "current" : ""}`}>
            <span>1. Your organization</span>
            <div className="bar">
              <i style={{ width: lstep > 0 ? "100%" : "50%" }}></i>
            </div>
          </div>
          <div className={`step ${lstep > 1 ? "done" : lstep === 1 ? "current" : ""}`}>
            <span>2. Your needs</span>
            <div className="bar">
              <i style={{ width: lstep > 1 ? "100%" : lstep === 1 ? "50%" : "0%" }}></i>
            </div>
          </div>
          <div className={`step ${lstep === 2 ? "current" : ""}`}>
            <span>3. Your details</span>
            <div className="bar">
              <i style={{ width: lstep === 2 ? "50%" : "0%" }}></i>
            </div>
          </div>
        </div>

        {!leadSuccess ? (
          <div className="panel" id="leadPanel">
            <form id="leadForm" onSubmit={handleSubmitLead} noValidate>
              <div className="panel-body">
                {lstep < LEAD_STEPS.length ? (
                  <div>
                    {LEAD_STEPS[lstep].map(q => (
                      <div className="qblock" key={q.id}>
                        <div className="qlabel">
                          {q.label}
                          {q.type === "multi" && (
                            <span className="opt"> (select all that apply)</span>
                          )}
                        </div>

                        {q.type === "pills" ? (
                          <div className="pills">
                            {q.opts.map(opt => {
                              const isSelected = leadAns[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`pill ${isSelected ? "selected" : ""}`}
                                  onClick={() => handleSelectRadio(q.id, opt)}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        ) : q.type === "multi" ? (
                          <div className={`options ${q.cols2 ? "cols2" : ""}`}>
                            {q.opts.map(opt => {
                              const isSelected = (leadAns[q.id] || []).includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`option ${isSelected ? "selected" : ""}`}
                                  onClick={() => handleToggleMulti(q.id, opt)}
                                >
                                  <span className="box" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  </span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className={`options ${q.cols2 ? "cols2" : ""}`} role="radiogroup">
                            {q.opts.map(opt => {
                              const isSelected = leadAns[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  className={`option ${isSelected ? "selected" : ""}`}
                                  role="radio"
                                  aria-checked={isSelected}
                                  onClick={() => handleSelectRadio(q.id, opt)}
                                >
                                  <span className="radio" aria-hidden="true"></span>
                                  <span>{opt}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {stepErrors[q.id] && (
                          <div className="qerr">
                            <svg>
                              <use href="#i-alert" />
                            </svg>
                            <span>{stepErrors[q.id]}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
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
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Clinical growth goals, current marketing tools, upcoming service launches…"
                        ></textarea>
                      </div>

                      <label className="checkline">
                        <input
                          type="checkbox"
                          id="lead-consent"
                          checked={consent}
                          onChange={e => setConsent(e.target.checked)}
                        />
                        I agree to HealthFoundry contacting me about this request. We never share your details.
                      </label>
                    </div>

                    {leadError ? (
                      <div className="callout error" id="leadError" style={{ marginTop: "var(--space-5)" }}>
                        <svg>
                          <use href="#i-alert" />
                        </svg>
                        <span>{leadError}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="panel-foot">
                <button
                  className="hf-btn ghost"
                  type="button"
                  id="leadBack"
                  style={{ visibility: lstep === 0 ? "hidden" : "visible" }}
                  onClick={handleBackStep}
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
                <a className="hf-btn outline" href={landingUrl}>
                  Back to Home
                </a>
                <a className="hf-btn primary" href={socialScoreUrl}>
                  Check your social score
                  <svg>
                    <use href="#i-arrow" />
                  </svg>
                </a>
              </div>
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
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 500 }}>Social media score</div>
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
