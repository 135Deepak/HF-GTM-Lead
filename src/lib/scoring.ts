export interface Question {
  cat: string;
  q: string;
  opts: [string, number][];
}

export interface ScoreBand {
  min: number;
  key: "low" | "growing" | "strong";
  label: string;
  title: string;
  text: string;
}

export interface CategoryScore {
  cat: string;
  pct: number;
}

export interface ScoreResult {
  score: number;
  band: ScoreBand;
  byCat: CategoryScore[];
  pointers: [string, string][];
}

export const QUESTIONS: Question[] = [
  {
    cat: "Presence",
    q: "How many social channels does your organization actively maintain?",
    opts: [
      ["None or just one", 0],
      ["Two", 1],
      ["Three to four", 2],
      ["Five or more, each with a clear purpose", 3]
    ]
  },
  {
    cat: "Cadence",
    q: "How often do you publish new content?",
    opts: [
      ["Rarely / ad hoc", 0],
      ["A few times a month", 1],
      ["Weekly", 2],
      ["Several times a week, on a content calendar", 3]
    ]
  },
  {
    cat: "Content",
    q: "What best describes your content mix?",
    opts: [
      ["Mostly announcements", 0],
      ["Announcements plus some health tips", 1],
      ["Educational content, stories and events", 2],
      ["Planned mix incl. video, patient stories and clinician voices", 3]
    ]
  },
  {
    cat: "Engagement",
    q: "How quickly do you respond to comments and messages?",
    opts: [
      ["We usually don't", 0],
      ["Within a week", 1],
      ["Within 1–2 days", 2],
      ["Same day, with a defined escalation path", 3]
    ]
  },
  {
    cat: "Measurement",
    q: "How do you measure social media performance?",
    opts: [
      ["We don't track it", 0],
      ["Follower counts", 1],
      ["Engagement and reach reports", 2],
      ["Tied to appointments, referrals or web conversions", 3]
    ]
  },
  {
    cat: "Governance",
    q: "Do you have a documented social media policy and approval workflow?",
    opts: [
      ["No", 0],
      ["Informal guidelines", 1],
      ["Written policy", 2],
      ["Written policy, approvals and compliance review", 3]
    ]
  }
];

export const BANDS: ScoreBand[] = [
  {
    min: 0,
    key: "low",
    label: "Low",
    title: "Plenty of room to grow",
    text: "Your social presence is in its early stages. HealthFoundry's Vital360 framework can help you build a strong patient acquisition foundation — starting with the right channels and a consistent voice."
  },
  {
    min: 40,
    key: "growing",
    label: "Growing",
    title: "Solid foundations, building momentum",
    text: "You have foundational habits in place. Focus on consistency and tying social activity to measurable patient outcomes — referrals, appointment requests and care continuity signals."
  },
  {
    min: 70,
    key: "strong",
    label: "Strong",
    title: "Ahead of most healthcare peers",
    text: "Your digital presence is mature. HealthFoundry specialists can help you convert this reach into measurable referral and retention growth through the Vital360 patient growth engine."
  }
];

export const POINTERS: Record<string, [string, string]> = {
  Presence: [
    "Consolidate your channels",
    "Pick the 2–3 platforms your patients actually use, complete every profile, and ensure each channel has a clear clinical purpose aligned to Vital360 patient acquisition goals."
  ],
  Cadence: [
    "Set a content calendar",
    "A predictable weekly rhythm builds audience trust faster than bursts of activity — and signals operational maturity to prospective patients and referring physicians."
  ],
  Content: [
    "Lead with clinician and patient stories",
    "Educational content, clinician voices and patient outcomes consistently outperform announcements — and directly support appointment-driven conversion."
  ],
  Engagement: [
    "Define a community response SLA",
    "Aim for same-day replies with a clear escalation path for clinical questions. Responsiveness is a trust signal that influences patient choice."
  ],
  Measurement: [
    "Connect social activity to growth outcomes",
    "Move beyond follower counts — track appointment requests, referral sources and care continuity signals that map directly to revenue cycle impact."
  ],
  Governance: [
    "Formalise your compliance framework",
    "A written policy, approval workflow and HIPAA-aware content review keeps you agile without regulatory risk — foundational to any scalable healthcare GTM programme."
  ]
};

export function computeScore(answers: (number | null)[]): ScoreResult {
  const max = QUESTIONS.length * 3;
  const total = answers.reduce<number>((s, a) => s + (a ?? 0), 0);
  const score = Math.round((total / max) * 100);
  const band = [...BANDS].reverse().find(b => score >= b.min) ?? BANDS[0];
  const byCat = QUESTIONS.map((q, i) => ({
    cat: q.cat,
    pct: Math.round(((answers[i] ?? 0) / 3) * 100)
  }));
  const pointers = [...byCat]
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 3)
    .map(c => POINTERS[c.cat]);
  return { score, band, byCat, pointers };
}
