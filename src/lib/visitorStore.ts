export interface VisitorDetails {
  name: string;
  company: string;
  email: string;
  title?: string;
  source?: "score" | "lead";
}

export interface ScoreData {
  score: number;
  band: "low" | "growing" | "strong";
  label: string;
}

export const DETAIL_KEYS: (keyof VisitorDetails)[] = ["name", "company", "email", "title"];

export const SOURCE_LABEL: Record<string, string> = {
  score: "your social score assessment",
  lead: "your contact request"
};

export const store = {
  get<T>(k: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("hf-" + k);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  set<T>(k: string, v: T): void {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem("hf-" + k, JSON.stringify(v));
    } catch {}
  }
};

export const getDetails = (): VisitorDetails | null => store.get<VisitorDetails>("details");
export const saveDetails = (details: VisitorDetails) => store.set("details", details);
export const getLastScore = (): ScoreData | null => store.get<ScoreData>("score");
export const saveLastScore = (score: ScoreData) => store.set("score", score);

export const getInitials = (n: string): string =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "?";
