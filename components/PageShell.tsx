import { Nav } from "@/components/Nav";
import { StaticSlicerBar } from "@/components/SlicerBar";

export function PageShell({
  eyebrow,
  title,
  subtitle,
  audienceTags,
  showSlicer = true,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  audienceTags?: React.ReactNode;
  showSlicer?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="bg-chrome text-white">
        <div className="mx-auto max-w-[1400px] px-4 pb-4 pt-4 md:px-6 md:pb-5 md:pt-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
            <div className="min-w-0">
              {eyebrow ? (
                <div className="text-[11px] font-semibold uppercase tracking-meta text-white/60">
                  {eyebrow}
                </div>
              ) : null}
              <h1 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-white md:text-[28px]">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1.5 max-w-3xl text-[12.5px] leading-5 text-white/75 md:text-[13px]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {audienceTags ? (
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                {audienceTags}
              </div>
            ) : null}
          </div>
          <div className="-mx-1 mt-3 overflow-x-auto md:mt-4 md:overflow-visible">
            <Nav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-4 md:px-6 md:py-5">
        {showSlicer ? (
          <div className="mb-4 md:mb-5">
            <StaticSlicerBar />
          </div>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-rule bg-canvas/60">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-[11px] text-ink-faint md:px-6">
          <span>
            Synthetic CCG-modeled data. No real affiliates, vendors, or transactions are represented. Bronze/silver/gold pipeline + Power BI surface.
          </span>
          <span className="font-mono tabular-nums">v6 · gold model</span>
        </div>
      </footer>
    </div>
  );
}
