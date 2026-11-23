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
    },
    {
      id: "facilities",
      label: "How many facilities or locations do you operate?",
      type: "pills",
      opts: ["1", "2–5", "6–20", "20+"]
    },
    {
      id: "role",
      label: "Which best describes your role?",
      type: "pills",
      opts: ["Leadership / C-suite", "Marketing", "Operations", "IT / digital", "Clinical"]
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
      id: "challenge",
      label: "What's the biggest blocker today?",
      type: "radio",
      opts: [
        "We don't know which channels bring patients",
        "Not enough time or people to execute",
        "Data is scattered across systems",
        "Hard to prove ROI to leadership",
        "Governance and compliance concerns slowing decisions"
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

  const f =
    {
      "1": 0,
      "2–5": 1,
      "6–20": 2,
      "20+": 3
    }[a.facilities ?? ""] ?? 0;

  const r = a.role === "Leadership / C-suite" ? 2 : 1;
  const s = t * 2 + f + r;
  return s >= 8 ? "hot" : s >= 4 ? "warm" : "nurture";
}
