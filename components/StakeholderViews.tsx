type LensKey = "platform" | "performance" | "executive" | "biteam";

type Block = {
  key: LensKey;
  title: string;
  caption: string;
  bullets: string[];
};

const blocks: Block[] = [
  {
    key: "platform",
    title: "Enterprise systems lens",
    caption: "Vendor coverage, false-positive rate, rule precision.",
    bullets: [
      "P1 shops trending",
      "False-positive rate by program",
      "Vendor crosswalk hits",
      "Schema-drift quarantines",
    ],
  },
  {
    key: "performance",
    title: "Performance management lens",
    caption: "Capture rate, root cause, affiliate workflow.",
    bullets: [
      "Capture rate by cohort",
      "Root cause mix",
      "Affiliate outreach queue",
      "Drift vs cohort median",
    ],
  },
  {
    key: "executive",
    title: "Executive lens",
    caption: "Recoverable dollars, recovery YTD, ROI.",
    bullets: [
      "Open matured leakage",
      "Recovered YTD",
      "Capture rate QoQ",
      "Top 10 vendor concentration",
    ],
  },
  {
    key: "biteam",
    title: "BI team daily workflow",
    caption: "Action list, status flips, feedback loop.",
    bullets: [
      "P1 / P2 / P3 queue",
      "Next action by claim",
      "Feedback labels",
      "60-day maturity gate",
    ],
  },
];

const accents: Record<LensKey, string> = {
  platform: "before:bg-amber-500",
  performance: "before:bg-emerald-600",
  executive: "before:bg-violet-600",
  biteam: "before:bg-blue-600",
};

export function StakeholderViews() {
  return (
    <section className="panel mt-5">
      <div className="border-b border-rule px-5 py-3">
        <h2 className="section-title">Same data, four lenses</h2>
        <p className="section-sub">
          Every consumer of the gold model sees a different slice. The dataset doesn&rsquo;t change &mdash; the framing does.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-px bg-rule md:grid-cols-2 xl:grid-cols-4">
        {blocks.map((b) => (
          <div
            key={b.title}
            className={`relative bg-surface px-5 py-4 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:content-[''] ${accents[b.key]}`}
          >
            <div className="text-[12.5px] font-semibold text-ink">{b.title}</div>
            <div className="text-[11.5px] text-ink-subtle">{b.caption}</div>
            <ul className="mt-3 space-y-1.5 text-[12.5px] text-ink-muted">
              {b.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-1.5">
                  <span className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-ink-faint" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
