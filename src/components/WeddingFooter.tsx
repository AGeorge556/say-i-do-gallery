export function WeddingFooter() {
  return (
    <footer className="py-16 px-6 text-center border-t border-border">
      {/* Decorative divider */}
      <div className="flex items-center gap-5 max-w-xs mx-auto mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary flex-shrink-0">
          <path d="M7 0L8.5 5.5H14L9.5 8.5L11 14L7 11L3 14L4.5 8.5L0 5.5H5.5L7 0Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
      </div>

      {/* Script names */}
      <p className="font-script text-5xl text-foreground leading-tight" style={{ paddingTop: "4px" }}>
        Ayman &amp; Nancy
      </p>

      <p className="mt-3 text-xs tracking-[0.28em] uppercase text-muted-foreground">
        June 6, 2026
      </p>
      <p className="mt-1 text-xs tracking-[0.18em] uppercase text-muted-foreground/70">
        All Saints&apos; Cathedral · Zamalek, Cairo
      </p>

      {/* Bottom ornament */}
      <div className="flex items-center gap-5 max-w-xs mx-auto mt-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-primary flex-shrink-0">
          <path d="M7 0L8.5 5.5H14L9.5 8.5L11 14L7 11L3 14L4.5 8.5L0 5.5H5.5L7 0Z" fill="currentColor" fillOpacity="0.5" />
        </svg>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
      </div>
    </footer>
  );
}
