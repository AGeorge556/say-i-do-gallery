import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rsvp")({
  head: () => ({
    meta: [
      { title: "RSVP — Nancy Nabil & Ayman Ayad" },
      { name: "description", content: "Kindly reply to the wedding invitation of Nancy Nabil & Ayman Ayad." },
      { property: "og:title", content: "RSVP — Nancy Nabil & Ayman Ayad" },
      { property: "og:description", content: "Please let us know if you'll be joining us on June 6, 2026." },
    ],
  }),
  component: RSVPPage,
});

type Attending = "yes" | "no" | null;

function RSVPPage() {
  const [attending, setAttending] = useState<Attending>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [dietary, setDietary] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; attending?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Please enter your name.";
    if (!attending) next.attending = "Please let us know if you'll attend.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const { error: insertError } = await supabase.from("rsvp_responses").insert({
      name: name.trim(),
      email: email.trim() || null,
      attending: attending as string,
      guest_count: attending === "yes" ? guestCount : null,
      dietary: attending === "yes" && dietary.trim() ? dietary.trim() : null,
    });

    if (insertError) {
      setErrors({ name: "Something went wrong. Please try again." });
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <WeddingNav />
        <div className="pt-24 pb-16 px-6 min-h-[80vh] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-md mx-auto"
          >
            {/* Ring / check icon */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-8 flex justify-center"
            >
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-primary">
                <circle cx="32" cy="32" r="20" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="32" cy="32" r="13" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="3 3" />
                <path d="M24 32 L30 38 L40 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
            >
              <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-4 font-body">
                {attending === "yes" ? "See you there" : "With love"}
              </p>
              <h1 className="font-heading text-5xl md:text-6xl text-foreground leading-tight">
                {attending === "yes" ? "You're on the list!" : "We'll miss you."}
              </h1>
              <p className="mt-5 font-serif text-xl text-muted-foreground leading-relaxed">
                {attending === "yes"
                  ? `Thank you, ${name}. We're so excited to celebrate with you on June 6, 2026. More details will follow soon.`
                  : `Thank you, ${name}. We're sorry you can't make it, but we appreciate you letting us know.`}
              </p>

              <div className="my-8 flex items-center gap-4 max-w-xs mx-auto">
                <div className="flex-1 h-px bg-border" />
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-primary">
                  <path d="M5 0L6.1 3.9H10L6.8 6.1L7.9 10L5 7.8L2.1 10L3.2 6.1L0 3.9H3.9L5 0Z" fill="currentColor" fillOpacity="0.55" />
                </svg>
                <div className="flex-1 h-px bg-border" />
              </div>

              <p
                className="font-script text-4xl text-foreground leading-none"
                style={{ paddingTop: "4px" }}
              >
                Nancy &amp; Ayman
              </p>
              <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2 font-body">
                June 6, 2026 · Zamalek, Cairo
              </p>
            </motion.div>
          </motion.div>
        </div>
        <WeddingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      <div className="pt-24 pb-16 px-6 max-w-xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-4 font-body">
            Kindly reply by May 20, 2026
          </p>
          <p
            className="font-script text-5xl text-primary leading-none mb-3"
            style={{ paddingTop: "4px" }}
          >
            You&apos;re invited
          </p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">RSVP</h1>
          <p className="mt-4 font-serif text-xl text-muted-foreground leading-relaxed">
            We hope you can join us to celebrate our special day
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          noValidate
          className="space-y-0"
        >
          {/* Attendance choice */}
          <div className="mb-8">
            <p className="text-xs font-medium text-foreground mb-4 text-center tracking-[0.15em] uppercase font-body">
              Will you be joining us?
            </p>
            <div className="grid grid-cols-2 gap-4">
              {(["yes", "no"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setAttending(option);
                    setErrors((prev) => ({ ...prev, attending: undefined }));
                  }}
                  className={`relative py-7 px-4 rounded-xl border-2 transition-all duration-200 text-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    attending === option
                      ? "border-primary bg-sage-light/40 text-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-sage-light/20"
                  }`}
                >
                  {attending === option && (
                    <motion.div
                      layoutId="attendance-indicator"
                      className="absolute inset-0 rounded-xl bg-sage-light/30"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <div className="mb-3 flex justify-center">
                    {option === "yes" ? (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={attending === option ? "text-primary" : "text-muted-foreground"}>
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                      </svg>
                    )}
                  </div>
                  <p className="font-heading text-lg leading-tight">
                    {option === "yes" ? "Joyfully Accepts" : "Regretfully Declines"}
                  </p>
                  <p className="text-xs mt-1.5 text-muted-foreground font-body">
                    {option === "yes" ? "I'll be there!" : "I can't make it"}
                  </p>
                </button>
              ))}
            </div>
            {errors.attending && (
              <p className="mt-2.5 text-sm text-destructive text-center font-body">{errors.attending}</p>
            )}
          </div>

          {/* Name */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="rsvp-name">
              Your Name <span className="text-destructive">*</span>
            </label>
            <input
              id="rsvp-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="Full name"
              className={`w-full rounded-xl border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body ${
                errors.name ? "border-destructive" : "border-input"
              }`}
              maxLength={120}
            />
            {errors.name && (
              <p className="mt-1.5 text-sm text-destructive font-body">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="rsvp-email">
              Email <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="rsvp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body"
            />
            <p className="mt-1.5 text-xs text-muted-foreground font-body">
              We'll send event details to this address
            </p>
          </div>

          {/* Conditional attending fields */}
          <AnimatePresence>
            {attending === "yes" && (
              <motion.div
                key="attending-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  {/* Guest count */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-foreground mb-3 tracking-wide uppercase font-body" htmlFor="rsvp-guests">
                      Number of Guests
                    </label>
                    <div className="flex items-center gap-5">
                      <button
                        type="button"
                        onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                        disabled={guestCount <= 1}
                        aria-label="Decrease guest count"
                        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12h14" />
                        </svg>
                      </button>
                      <span className="font-heading text-3xl text-foreground min-w-[2ch] text-center tabular-nums" aria-live="polite">
                        {guestCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGuestCount((n) => Math.min(10, n + 1))}
                        disabled={guestCount >= 10}
                        aria-label="Increase guest count"
                        className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                      <span className="text-sm text-muted-foreground font-body">
                        {guestCount === 1 ? "person" : "people"}
                      </span>
                    </div>
                  </div>

                  {/* Dietary */}
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="rsvp-dietary">
                      Dietary Requirements{" "}
                      <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      id="rsvp-dietary"
                      value={dietary}
                      onChange={(e) => setDietary(e.target.value)}
                      placeholder="Vegetarian, gluten-free, allergies, etc."
                      rows={3}
                      className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors text-base font-body"
                      maxLength={400}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <div className="mt-8">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-13 text-sm tracking-[0.2em] uppercase rounded-full cursor-pointer"
            >
              <AnimatePresence mode="wait">
                {submitting ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    Sending…
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {attending === "no" ? "Send My Regrets" : "Send RSVP"}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </motion.form>
      </div>

      <WeddingFooter />
    </div>
  );
}
