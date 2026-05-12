import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import heroBotanical from "@/assets/hero-botanical.jpg";
import heroImage from "@/assets/Hero.jpeg";
import coupleWalking from "@/assets/WhatsApp Image 2026-04-16 at 10.44.49 AM.jpeg";
import coupleEmbracing from "@/assets/WhatsApp Image 2026-04-16 at 10.44.50 AM.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nancy Nabil & Ayman Ayad — June 6, 2026" },
      { name: "description", content: "Join us to celebrate the wedding of Nancy Nabil & Ayman Ayad on June 6, 2026 at All Saints' Cathedral, Zamalek." },
      { property: "og:title", content: "Nancy Nabil & Ayman Ayad — Wedding" },
      { property: "og:description", content: "Celebrate love with Nancy Nabil & Ayman Ayad. June 6, 2026." },
    ],
  }),
  component: HomePage,
});

const WEDDING_DATE = new Date("2026-06-06T15:00:00+02:00");

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function getTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  useEffect(() => {
    setTimeLeft(getTimeLeft(target));
    const id = setInterval(() => setTimeLeft(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);
  return timeLeft;
}

function CountdownUnit({ value, label }: { value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 min-w-[60px]">
      <span className="font-heading text-5xl md:text-6xl text-foreground tabular-nums leading-none">
        {value === null ? "--" : String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground font-body">
        {label}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-5 font-body">
      {children}
    </p>
  );
}

function Ornament() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-primary inline-block flex-shrink-0">
      <path d="M6 0L7.3 4.7H12L8.2 7.3L9.5 12L6 9.4L2.5 12L3.8 7.3L0 4.7H4.7L6 0Z" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}

function HomePage() {
  const countdown = useCountdown(WEDDING_DATE);

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      {/* ── Hero ── */}
      <section
        className="relative flex flex-col items-center justify-center overflow-hidden pt-16"
        style={{ minHeight: "min(100svh, 100vh)", backgroundColor: "var(--cream)" }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-10 sm:py-14">
          <motion.img
            src={heroImage}
            alt="Ayman & Nancy — Save the Date, June 6 2026"
            fetchPriority="high"
            className="w-full h-auto block rounded-2xl shadow-xl"
            style={{ maxWidth: "min(540px, 92vw)" }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-10 flex flex-col items-center gap-4"
          >
            <Link
              to="/rsvp"
              className="inline-block px-10 py-3.5 rounded-full border border-primary text-primary text-[11px] tracking-[0.28em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-body"
            >
              Kindly RSVP
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Countdown ── */}
      <section className="py-20 sm:py-24 px-6 border-b border-border bg-cream-dark/40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center"
        >
          {/* Romantic script label */}
          <p
            className="font-script text-4xl text-primary mb-2 leading-none"
            style={{ paddingTop: "4px" }}
          >
            counting down to forever
          </p>

          {/* Thin ornamental divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <Ornament />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>

          {/* Timer units */}
          <div className="flex items-start justify-center gap-6 sm:gap-10 md:gap-14">
            <CountdownUnit value={countdown?.days ?? null} label="Days" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.hours ?? null} label="Hours" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.minutes ?? null} label="Minutes" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.seconds ?? null} label="Seconds" />
          </div>

          {/* Date caption */}
          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <p className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground/70 font-body px-2 whitespace-nowrap">
              June 6, 2026 · Cairo, Egypt
            </p>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>
        </motion.div>
      </section>

      {/* ── Couple photo break ── */}
      <section className="relative overflow-hidden" style={{ height: "clamp(320px, 52vw, 580px)" }}>
        <img
          src={coupleWalking}
          alt="Nancy Nabil and Ayman Ayad walking together"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      </section>

      {/* ── Venue ── */}
      <section className="py-24 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          {/* Photo with decorative frame */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            {/* Offset decorative border */}
            <div
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-border/60"
              aria-hidden="true"
            />
            <div
              className="relative rounded-2xl overflow-hidden shadow-lg"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={coupleEmbracing}
                alt="Nancy Nabil and Ayman Ayad at the cathedral"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.12 }}
          >
            <SectionLabel>The Ceremony</SectionLabel>

            <h2 className="font-heading text-5xl md:text-6xl text-foreground leading-[1.08]">
              All Saints'<br />Cathedral
            </h2>

            <p className="mt-3 text-muted-foreground text-base tracking-wide font-body">Zamalek, Cairo</p>

            <div className="my-7 flex items-center gap-4">
              <div className="w-10 h-px bg-primary" />
              <Ornament />
            </div>

            <p className="font-serif text-xl text-foreground/85 leading-relaxed italic">
              "One of Cairo's most beloved historic landmarks, nestled in the heart of Zamalek."
            </p>

            <p className="mt-5 text-muted-foreground font-body leading-relaxed">
              Join us for an intimate ceremony celebrating our love in this grand and beautiful church.
            </p>

            <p className="mt-4 font-body text-foreground/90">
              <span className="font-medium">Saturday, June 6, 2026</span>
              <span className="text-muted-foreground"> · 3:00 PM</span>
            </p>

            <a
              href="https://maps.app.goo.gl/DXP7949MDwhf3GFf7"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2.5 text-sm text-primary hover:text-primary/80 transition-colors group cursor-pointer font-body"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="tracking-wide group-hover:underline underline-offset-2">Get Directions</span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── RSVP CTA ── */}
      <section className="relative py-28 sm:py-32 px-6 overflow-hidden border-t border-border bg-cream-dark/30">
        {/* Botanical watermark */}
        <img
          src={heroBotanical}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain object-center opacity-[0.06] pointer-events-none select-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-xl mx-auto text-center"
        >
          <SectionLabel>Kindly reply by May 20, 2026</SectionLabel>

          {/* Script accent */}
          <p
            className="font-script text-5xl text-primary mb-3 leading-none"
            style={{ paddingTop: "4px" }}
          >
            Will you join us?
          </p>

          <h2 className="font-heading text-4xl md:text-5xl text-foreground mt-2">
            We'd love to have you
          </h2>

          <p className="mt-5 font-serif text-xl text-muted-foreground leading-relaxed">
            Please let us know if you'll be there to celebrate with us.
          </p>

          <div className="mt-12">
            <Link
              to="/rsvp"
              className="inline-block px-12 py-4 rounded-full bg-primary text-primary-foreground text-[11px] tracking-[0.3em] uppercase hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg font-body"
            >
              RSVP Now
            </Link>
          </div>
        </motion.div>
      </section>

      <WeddingFooter />
    </div>
  );
}
