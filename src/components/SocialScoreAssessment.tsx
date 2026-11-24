import React, { useState, useEffect } from "react";
import { QUESTIONS, computeScore } from "../lib/scoring";
import type { ScoreResult } from "../lib/scoring";
import {
  getDetails,
  saveDetails,
  saveLastScore
} from "../lib/visitorStore";
import type { VisitorDetails } from "../lib/visitorStore";
import { validateOrgEmail } from "../lib/validateEmail";
import { PersonalDetails } from "./PersonalDetails";
import { showToast } from "../lib/toast";

export const SocialScoreAssessment: React.FC = () => {
  const [step, setStep] = useState<number>(0);
  const [qi, setQi] = useState<number>(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(QUESTIONS.length).fill(null)
  );

  const [details, setDetails] = useState<VisitorDetails>({
    name: "",
    company: "",
    email: "",
    title: "",
    source: "score"
  });
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gateError, setGateError] = useState<string>("");
  const [calculating, setCalculating] = useState<boolean>(false);

  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [displayScore, setDisplayScore] = useState<number>(0);
  const [animatedOffset, setAnimatedOffset] = useState<number>(326.73);
  const [barsAnimated, setBarsAnimated] = useState<boolean>(false);
  const [payloadJson, setPayloadJson] = useState<string>("");

  useEffect(() => {
    const saved = getDetails();
    if (saved && saved.email) {
      setDetails({ ...saved, source: "score" });
      setIsEditing(false);
      setHasHydrated(true);
    }
  }, []);

  const handleFieldChange = (field: keyof VisitorDetails, val: string) => {
    setDetails(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    setGateError("");
  };

  const handleSelectOption = (w: number) => {
    setAnswers(prev => {
      const next = [...prev];
      next[qi] = w;
      return next;
    });
  };

  const handleNextQ = () => {
    if (qi < QUESTIONS.length - 1) {
      setQi(qi + 1);
    } else {
      setStep(1);
    }
  };

  const handleBackQ = () => {
    if (qi > 0) {
      setQi(qi - 1);
    }
  };

  const handleGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!details.name.trim()) newErrors.name = "Required";
    if (!details.company.trim()) newErrors.company = "Required";

    if (!details.email.trim()) {
      newErrors.email = "Required";
    } else {
      const emailCheck = validateOrgEmail(details.email);
      if (!emailCheck.ok) {
        newErrors.email = emailCheck.reason || "Invalid email";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsEditing(true);
      return;
    }

    setCalculating(true);
    setGateError("");

    const completeAnswers = answers.map(a => a ?? 0);
    const result = computeScore(completeAnswers);

    let savedRowData: any = null;

    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          answers: completeAnswers
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setGateError(data?.reason || "Failed to record assessment to Google Sheets. Please try again.");
        setCalculating(false);
        return;
      }
      savedRowData = data.row;
      setPayloadJson(
        `// Confirmed saved to Google Sheet (${data.row?.sheet || "Assessments"} tab, row #${data.row?.rowNumber || ""}):\n` +
          JSON.stringify(data.row, null, 2)
      );
    } catch {
      setGateError("Unable to reach the server to save your assessment to Google Sheets. Please check your connection and try again.");
      setCalculating(false);
      return;
    }

    const savedDetails: VisitorDetails = { ...details, source: "score" };
    saveDetails(savedDetails);
    saveLastScore({
      score: result.score,
      band: result.band.key,
      label: result.band.label
    });

    setScoreResult(result);
    setCalculating(false);
    setStep(2);
    showToast("Response recorded to Google Sheet & benchmark unlocked");

    // Animate score counter and circle
    const C = 326.73;
    const targetOffset = C * (1 - result.score / 100);
    const t0 = performance.now();
    const duration = 900;

    const animate = (t: number) => {
      const progress = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(result.score * eased));
      setAnimatedOffset(C - (C - targetOffset) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayScore(result.score);
        setAnimatedOffset(targetOffset);
        setBarsAnimated(true);
      }
    };
    requestAnimationFrame(animate);
  };

  const handleRetake = () => {
    setAnswers(new Array(QUESTIONS.length).fill(null));
    setQi(0);
    setScoreResult(null);
    setBarsAnimated(false);
    setStep(0);
  };

  const currentQ = QUESTIONS[qi];
  const ringStroke =
    scoreResult?.band.key === "low"
      ? "hsl(var(--destructive))"
      : scoreResult?.band.key === "growing"
        ? "hsl(var(--warning))"
        : "hsl(var(--success))";

  return (
    <div>
      <div className="stepper" id="scoreStepper">
        <div className={`step ${step > 0 ? "done" : step === 0 ? "current" : ""}`}>
          <span>1. Questions</span>
          <div className="bar">
            <i></i>
          </div>
        </div>
        <div className={`step ${step > 1 ? "done" : step === 1 ? "current" : ""}`}>
          <span>2. Your details</span>
          <div className="bar">
            <i></i>
          </div>
        </div>
        <div className={`step ${step === 2 ? "current" : ""}`}>
          <span>3. Your score</span>
          <div className="bar">
            <i></i>
          </div>
        </div>
      </div>

      {/* Step 1: Questions */}
      {step === 0 && (
        <div className="panel" id="qPanel">
          <div className="panel-body">
            <div className="q-meta">
              <span className="hf-overline" id="qCategory">
                {currentQ.cat}
              </span>
              <span
                className="hf-num"
                style={{ fontSize: "var(--fs-xs)", color: "hsl(var(--muted-foreground))" }}
                id="qCount"
              >
                {qi + 1} / {QUESTIONS.length}
              </span>
            </div>
            <h2 className="q-title" id="qTitle">
              {currentQ.q}
            </h2>
            <div className="options" id="qOptions" role="radiogroup">
              {currentQ.opts.map(([label, weight]) => {
                const isSelected = answers[qi] === weight;
                return (
                  <button
                    key={label}
                    type="button"
                    className={`option ${isSelected ? "selected" : ""}`}
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleSelectOption(weight)}
                  >
                    <span className="radio"></span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="panel-foot">
            <button
              className="hf-btn ghost"
              id="qBack"
              style={{ visibility: qi === 0 ? "hidden" : "visible" }}
              onClick={handleBackQ}
            >
              <svg>
                <use href="#i-arrowLeft" />
              </svg>
              Back
            </button>
            <button
              className="hf-btn primary"
              id="qNext"
              disabled={answers[qi] === null}
              onClick={handleNextQ}
            >
              {qi === QUESTIONS.length - 1 ? "See my benchmark" : "Next"}
              <svg>
                <use href="#i-arrow" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Gate */}
      {step === 1 && (
        <div className="panel" id="gatePanel">
          <form className="panel-body" id="gateForm" onSubmit={handleGateSubmit} noValidate>
            <div className="locked" aria-hidden="true">
              <div className="blur">
                <div style={{ fontSize: "2.5rem", fontWeight: 600 }}>72</div>
                <div>
                  <div className="band strong">Strong</div>
                  <p style={{ marginTop: "8px", fontSize: "var(--fs-sm)" }}>
                    Your social presence is ahead of most peers…
                  </p>
                </div>
              </div>
              <div className="lock-msg">
                <svg>
                  <use href="#i-lock" />
                </svg>
                Your score is ready — enter your details to unlock it
              </div>
            </div>

            <PersonalDetails
              idPrefix="score"
              values={details}
              onChange={handleFieldChange}
              errors={errors}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              hasHydratedFromStore={hasHydrated}
            />

            <p className="known-note" style={{ marginTop: "var(--space-4)" }}>
              By continuing, you agree HealthFoundry may contact you about your results.
            </p>

            {gateError ? (
              <div className="callout error" style={{ marginTop: "var(--space-4)" }}>
                <svg>
                  <use href="#i-alert" />
                </svg>
                <span>{gateError}</span>
              </div>
            ) : null}
          </form>
          <div className="panel-foot">
            <button
              className="hf-btn ghost"
              id="gateBack"
              type="button"
              onClick={() => setStep(0)}
            >
              <svg>
                <use href="#i-arrowLeft" />
              </svg>
              Back
            </button>
            <button
              className={`hf-btn primary ${calculating ? "loading" : ""}`}
              type="submit"
              form="gateForm"
              id="gateSubmit"
              disabled={calculating}
              onClick={handleGateSubmit}
            >
              {calculating ? (
                <>
                  <span className="spinner"></span>Analyzing & recording…
                </>
              ) : (
                <>
                  Reveal my benchmark
                  <svg>
                    <use href="#i-arrow" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 2 && scoreResult && (
        <div className="panel" id="resultPanel">
          <div className="panel-body">
            <div className="result-top">
              <div className="ring">
                <svg viewBox="0 0 120 120">
                  <circle
                    className="track"
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                  />
                  <circle
                    className="val"
                    id="ringVal"
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeDasharray="326.73"
                    strokeDashoffset={animatedOffset}
                    style={{ stroke: ringStroke }}
                  />
                </svg>
                <div className="center">
                  <div>
                    <div className="score" id="scoreNum">
                      {displayScore}
                    </div>
                    <div className="of">out of 100</div>
                  </div>
                </div>
              </div>
              <div className="result-summary">
                <span className={`band ${scoreResult.band.key}`} id="bandChip">
                  {scoreResult.band.label}
                </span>
                <h2 id="bandTitle">{scoreResult.band.title}</h2>
                <p id="bandText">{scoreResult.band.text}</p>
              </div>
            </div>

            <div className="breakdown" id="breakdown">
              {scoreResult.byCat.map(c => (
                <div className="bd-row" key={c.cat}>
                  <span>{c.cat}</span>
                  <div className="bd-bar">
                    <i
                      style={{
                        width: barsAnimated ? `${c.pct}%` : "0%",
                        transition: "width 600ms cubic-bezier(0.16, 1, 0.3, 1)"
                      }}
                    ></i>
                  </div>
                  <span className="hf-num">{c.pct}%</span>
                </div>
              ))}
            </div>

            <div className="hf-overline" style={{ marginTop: "var(--space-8)" }}>
              Where to focus next
            </div>
            <div className="pointers" id="pointers" style={{ marginTop: "var(--space-3)" }}>
              {scoreResult.pointers.map(([title, desc], i) => (
                <div className="pointer" key={title}>
                  <div className="n">{i + 1}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>

            <details className="mock-row">
              <summary>Response recorded: sheet ledger row</summary>
              <div className="payload" id="assessmentPayload">
                {payloadJson}
              </div>
            </details>
          </div>
          <div className="panel-foot">
            <button className="hf-btn ghost" id="retake" onClick={handleRetake}>
              Retake assessment
            </button>
            <a className="hf-btn primary" href="/lead">
              Talk to an expert
              <svg>
                <use href="#i-arrow" />
              </svg>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
