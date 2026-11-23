import React, { useState, useEffect } from "react";
import type { VisitorDetails } from "../lib/visitorStore";
import { SOURCE_LABEL, getInitials } from "../lib/visitorStore";
import { validateOrgEmail } from "../lib/validateEmail";

interface PersonalDetailsProps {
  idPrefix: string;
  values: VisitorDetails;
  onChange: (field: keyof VisitorDetails, val: string) => void;
  errors: Record<string, string>;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  hasHydratedFromStore?: boolean;
}

export const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  idPrefix,
  values,
  onChange,
  errors,
  isEditing,
  setIsEditing,
  hasHydratedFromStore
}) => {
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"valid" | "invalid" | null>(null);
  const [emailMsg, setEmailMsg] = useState<string>("");

  useEffect(() => {
    if (values.email) {
      const res = validateOrgEmail(values.email);
      if (res.ok) {
        setEmailStatus("valid");
        setEmailMsg("Organization email verified");
      } else if (emailTouched) {
        setEmailStatus("invalid");
        setEmailMsg(res.reason || "Invalid email");
      }
    } else {
      setEmailStatus(null);
      setEmailMsg("");
    }
  }, [values.email, emailTouched]);

  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (!values.email.trim()) {
      setEmailStatus(null);
      setEmailMsg("");
      return;
    }
    const res = validateOrgEmail(values.email);
    if (res.ok) {
      setEmailStatus("valid");
      setEmailMsg("Organization email verified");
    } else {
      setEmailStatus("invalid");
      setEmailMsg(res.reason || "Invalid email");
    }
  };

  const showKnown = !isEditing && hasHydratedFromStore && Boolean(values.email);

  return (
    <div data-personal-details={idPrefix}>
      <div className="hf-overline sec">Your details</div>

      {showKnown ? (
        <div className="known-wrap">
          <div className="known">
            <div className="avatar">{getInitials(values.name)}</div>
            <div className="known-text">
              <div className="known-name">
                {[values.name, values.title].filter(Boolean).join(" · ")}
              </div>
              <div className="known-sub">
                {values.email} · {values.company}
              </div>
            </div>
            <button
              type="button"
              className="hf-btn outline sm known-edit"
              onClick={() => setIsEditing(true)}
            >
              <svg>
                <use href="#i-pencil" />
              </svg>
              Edit
            </button>
          </div>
          <div className="known-note">
            <svg>
              <use href="#i-checkCircle" />
            </svg>
            <span>
              {`Pre-filled from ${SOURCE_LABEL[values.source ?? "score"] ?? "earlier"}. Edit if anything has changed.`}
            </span>
          </div>
        </div>
      ) : null}

      <div className={`fields ${showKnown ? "hidden" : ""}`}>
        <div className="row2">
          <div className={`f ${errors.name ? "invalid" : ""}`}>
            <label htmlFor={`${idPrefix}-name`}>
              Full name<span className="req">*</span>
            </label>
            <input
              className="input"
              id={`${idPrefix}-name`}
              name="name"
              autoComplete="name"
              placeholder="Jordan Lee"
              value={values.name}
              onChange={e => onChange("name", e.target.value)}
              required
            />
            <div className="hint">
              {errors.name ? (
                <>
                  <svg>
                    <use href="#i-alert" />
                  </svg>
                  <span>{errors.name}</span>
                </>
              ) : null}
            </div>
          </div>

          <div className={`f ${errors.company ? "invalid" : ""}`}>
            <label htmlFor={`${idPrefix}-company`}>
              Organization<span className="req">*</span>
            </label>
            <input
              className="input"
              id={`${idPrefix}-company`}
              name="company"
              autoComplete="organization"
              placeholder="Riverside Health"
              value={values.company}
              onChange={e => onChange("company", e.target.value)}
              required
            />
            <div className="hint">
              {errors.company ? (
                <>
                  <svg>
                    <use href="#i-alert" />
                  </svg>
                  <span>{errors.company}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="row2">
          <div
            className={`f ${
              errors.email || emailStatus === "invalid"
                ? "invalid"
                : emailStatus === "valid"
                  ? "valid"
                  : ""
            }`}
            data-email
          >
            <label htmlFor={`${idPrefix}-email`}>
              Work email<span className="req">*</span>
            </label>
            <input
              className="input"
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@yourhospital.org"
              value={values.email}
              onChange={e => onChange("email", e.target.value)}
              onBlur={handleEmailBlur}
              required
            />
            <div className="hint">
              {errors.email || emailStatus === "invalid" ? (
                <>
                  <svg>
                    <use href="#i-alert" />
                  </svg>
                  <span>{errors.email || emailMsg}</span>
                </>
              ) : emailStatus === "valid" ? (
                <>
                  <svg>
                    <use href="#i-checkCircle" />
                  </svg>
                  <span>{emailMsg}</span>
                </>
              ) : (
                "Use your organization email — personal addresses aren't accepted."
              )}
            </div>
          </div>

          <div className="f">
            <label htmlFor={`${idPrefix}-title`}>Job title</label>
            <input
              className="input"
              id={`${idPrefix}-title`}
              name="title"
              autoComplete="organization-title"
              placeholder="Marketing director"
              value={values.title || ""}
              onChange={e => onChange("title", e.target.value)}
            />
            <div className="hint"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
