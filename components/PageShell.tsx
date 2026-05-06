import { Nav } from "@/components/Nav";
import { StaticSlicerBar } from "@/components/SlicerBar";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  audienceTags,
  showSlicer = true,
  children,
  framingNote,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  audienceTags?: React.ReactNode;
  showSlicer?: boolean;
  children: React.ReactNode;
  framingNote?: string;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Navy chrome — Power BI report header */}
      <header className="bg-chrome text-white">
        <div className="mx-auto max-w-[1400px] px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              {eyebrow ? (
                <div className="text-[11px] font-semibold uppercase tracking-meta text-white/60">
                  {eyebrow}
                </div>
              ) : null}
              <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-white md:text-[28px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-3xl text-[13px] leading-5 text-white/75">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {audienceTags ? (
              <div className="flex shrink-0 flex-wrap items-center gap-1.5 pt-1">
                {audienceTags}
              </div>
            ) : null}
          </div>
          <div className="mt-4">
            <Nav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-5">
        {showSlicer ? (
          <div className="mb-5">
            <StaticSlicerBar />
          </div>
        ) : null}
        {children}
      </main>

      {framingNote ? (
        <footer className="framing-strip">
          <div className="mx-auto max-w-[1400px] px-6 py-4">
            <p className="text-[12px] italic text-ink-subtle">{framingNote}</p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
