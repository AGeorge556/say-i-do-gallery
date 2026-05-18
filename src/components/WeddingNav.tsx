import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { id: "hero", label: "Home" },
  { id: "gallery", label: "Gallery" },
  { id: "guestbook", label: "Guestbook" },
] as const;

function scrollTo(id: string) {
  if (id === "hero") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
}

export function WeddingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);

      const sectionIds = ["rsvp", "guestbook", "gallery"];
      let current = "hero";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight / 2) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border transition-shadow duration-300 ${
        scrolled ? "shadow-sm" : "shadow-none"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => scrollTo("hero")}
          className="font-script text-3xl leading-none text-foreground hover:text-primary transition-colors duration-200 cursor-pointer"
          style={{ paddingTop: "4px" }}
        >
          A &amp; N
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => scrollTo(link.id)}
                className={`relative text-xs tracking-[0.22em] uppercase transition-colors duration-200 pb-0.5 cursor-pointer ${
                  active
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-0.5 left-0 right-0 h-px bg-primary"
                  />
                )}
              </button>
            );
          })}
          <button
            onClick={() => scrollTo("rsvp")}
            className={`text-xs tracking-[0.22em] uppercase px-5 py-2.5 rounded-full border transition-all duration-200 cursor-pointer ${
              activeSection === "rsvp"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
            }`}
          >
            RSVP
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-foreground cursor-pointer"
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            {mobileOpen ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 7h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden bg-background/95 border-b border-border overflow-hidden"
          >
            <div className="px-6 py-5 flex flex-col gap-5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => { scrollTo(link.id); setMobileOpen(false); }}
                  className={`text-xs tracking-[0.22em] uppercase text-left cursor-pointer ${
                    activeSection === link.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-border pt-4">
                <button
                  onClick={() => { scrollTo("rsvp"); setMobileOpen(false); }}
                  className="inline-block text-xs tracking-[0.22em] uppercase px-6 py-3 rounded-full bg-primary text-primary-foreground cursor-pointer"
                >
                  RSVP
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
