import { Link, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { to: "/" as const, label: "Home" },
  { to: "/gallery" as const, label: "Gallery" },
  { to: "/guestbook" as const, label: "Guestbook" },
] as const;

export function WeddingNav() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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
        {/* Script monogram logo */}
        <Link
          to="/"
          className="font-script text-3xl leading-none text-foreground hover:text-primary transition-colors duration-200"
          style={{ paddingTop: "4px" }}
        >
          N &amp; A
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`relative text-xs tracking-[0.22em] uppercase transition-colors duration-200 pb-0.5 ${
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
              </Link>
            );
          })}
          <Link
            to="/rsvp"
            className={`text-xs tracking-[0.22em] uppercase px-5 py-2.5 rounded-full border transition-all duration-200 ${
              location.pathname === "/rsvp"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
            }`}
          >
            RSVP
          </Link>
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
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`text-xs tracking-[0.22em] uppercase ${
                    location.pathname === link.to
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-border pt-4">
                <Link
                  to="/rsvp"
                  onClick={() => setMobileOpen(false)}
                  className="inline-block text-xs tracking-[0.22em] uppercase px-6 py-3 rounded-full bg-primary text-primary-foreground"
                >
                  RSVP
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
