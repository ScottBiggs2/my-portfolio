export interface BlogPost {
  title: string;
  date: string; // ISO date string, e.g. "2026-02-27"
  summary: string;
  link?: string;
}

export const blogPosts: BlogPost[] = [
  {
    title: "Notes on DeepWeightFlow",
    date: "2026-02-27",
    summary:
      "Some informal notes on what motivated DeepWeightFlow, what surprised us while building it, and how it fits into the broader space of weight-space generative models.",
    link: "https://arxiv.org/abs/2601.05052",
  },
];

