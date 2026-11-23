export interface LeadQuestion {
  id: string;
  label: string;
  type: "radio" | "pills" | "multi";
  cols2?: boolean;
  hint?: string;
  opts: string[];
}

export const LEAD_STEPS: LeadQuestion[][] = [
  [
    {
      id: "orgType",
      label: "What type of organization are you?",
      type: "radio",
      cols2: true,
      opts: [
        "Hospital / health system",
        "Multi-specialty clinic",
        "Diagnostics / lab network",
        "Payer, pharma or other"
      ]
    }
  ],
  [
    {
      id: "priorities",
      label: "What are you looking to improve?",
      hint: "Select all that apply",
      type: "multi",
      cols2: true,
      opts: [
        "Patient acquisition",
        "Referral growth",
        "Brand & social media",
        "Revenue cycle & FinOps",
        "Governance & compliance",
        "Operational analytics",
        "Patient experience",
        "Something else"
      ]
    },
    {
      id: "timeline",
      label: "When are you looking to get started?",
      type: "pills",
      opts: ["Just exploring", "Next 6 months", "This quarter", "Budget approved"]
    }
  ]
];

export function leadFit(a: { timeline?: string; facilities?: string; role?: string }): "hot" | "warm" | "nurture" {
  const t =
    {
      "Just exploring": 0,
      "Next 6 months": 1,
      "This quarter": 2,
      "Budget approved": 3
    }[a.timeline ?? ""] ?? 0;

  const s = t * 3;
  return s >= 8 ? "hot" : s >= 3 ? "warm" : "nurture";
}
