import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";

const HeroCanvas = lazy(() =>
  import("@/components/HeroCanvas").then((m) => ({ default: m.HeroCanvas }))
);
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroBotanical from "@/assets/hero-botanical.jpg";
import heroImage from "@/assets/3.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ayman Ayad & Nancy Nabil — June 6, 2026" },
      { name: "description", content: "Join us to celebrate the wedding of Ayman Ayad & Nancy Nabil on June 6, 2026 at All Saints' Cathedral, Zamalek." },
      { property: "og:title", content: "Ayman Ayad & Nancy Nabil — Wedding" },
      { property: "og:description", content: "Celebrate love with Ayman Ayad & Nancy Nabil. June 6, 2026." },
    ],
  }),
  component: HomePage,
});

const WEDDING_DATE = new Date("2026-06-06T19:30:00+02:00");
const BUCKET = "wedding-gallery";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };
type Attending = "yes" | "no" | null;

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
}

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

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

function isVideo(name: string) {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(name);
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

  // Parallax — global scroll
  const { scrollY } = useScroll();
  const heroImageRaw  = useTransform(scrollY, [0, 700], [0, -55]);
  const heroImageY    = useSpring(heroImageRaw,  { stiffness: 80, damping: 20 });
  const heroBgScaleR  = useTransform(scrollY, [0, 700], [1, 1.08]);
  const heroBgScale   = useSpring(heroBgScaleR,  { stiffness: 60, damping: 18 });

  // Venue section parallax
  const venueRef      = useRef<HTMLElement>(null);
  const { scrollYProgress: venueP } = useScroll({ target: venueRef, offset: ["start end", "end start"] });
  const venueMapY     = useTransform(venueP, [0, 1], [50, -50]);

  // Botanical (RSVP bg)
  const rsvpRef       = useRef<HTMLElement>(null);
  const { scrollYProgress: rsvpP } = useScroll({ target: rsvpRef, offset: ["start end", "end start"] });
  const botanicalY    = useTransform(rsvpP, [0, 1], [-30, 30]);

  // RSVP state
  const [attending, setAttending] = useState<Attending>(null);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [rsvpSubmitted, setRsvpSubmitted] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpErrors, setRsvpErrors] = useState<{ name?: string; attending?: string }>({});

  // Guestbook state
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [gbName, setGbName] = useState("");
  const [gbMessage, setGbMessage] = useState("");
  const [gbLoading, setGbLoading] = useState(true);
  const [gbSubmitting, setGbSubmitting] = useState(false);
  const [gbError, setGbError] = useState<string | null>(null);

  // Gallery state
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [galleryFetchError, setGalleryFetchError] = useState(false);

  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("guestbook_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMessages(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            message: m.message,
            createdAt: new Date(m.created_at),
          }))
        );
      }
      setGbLoading(false);
    }

    fetchMessages();

    const channel = supabase
      .channel("guestbook_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guestbook_messages" },
        (payload) => {
          const row = payload.new as { id: string; name: string; message: string; created_at: string };
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              { id: row.id, name: row.name, message: row.message, createdAt: new Date(row.created_at) },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    async function loadGallery() {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { sortBy: { column: "created_at", order: "desc" }, limit: 200 });

      if (error || !data) {
        setGalleryFetchError(true);
        setGalleryLoading(false);
        return;
      }

      const files = data.filter((f) => f.name !== ".emptyFolderPlaceholder");
      const mapped: GalleryItem[] = files.map((file) => {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
        return {
          id: file.id ?? file.name,
          url: publicUrl,
          type: isVideo(file.name) ? "video" : "image",
          name: file.name,
        };
      });

      setGalleryItems(mapped);
      setGalleryLoading(false);
    }

    loadGallery();
  }, []);

  const validateRsvp = () => {
    const next: typeof rsvpErrors = {};
    if (!rsvpName.trim()) next.name = "Please enter your name.";
    if (!attending) next.attending = "Please let us know if you'll attend.";
    setRsvpErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRsvp()) return;
    setRsvpSubmitting(true);

    const { error: insertError } = await supabase.from("rsvp_responses").insert({
      name: rsvpName.trim(),
      email: rsvpEmail.trim() || null,
      attending: attending as string,
      guest_count: attending === "yes" ? guestCount : null,
    });

    if (insertError) {
      setRsvpErrors({ name: "Something went wrong. Please try again." });
      setRsvpSubmitting(false);
      return;
    }

    setRsvpSubmitting(false);
    setRsvpSubmitted(true);
  };

  const handleGbSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gbName.trim() || !gbMessage.trim()) return;
    setGbSubmitting(true);
    setGbError(null);

    const { data, error: insertError } = await supabase
      .from("guestbook_messages")
      .insert({ name: gbName.trim(), message: gbMessage.trim() })
      .select()
      .single();

    if (insertError) {
      setGbError("Something went wrong. Please try again.");
    } else if (data) {
      setMessages((prev) => [
        { id: data.id, name: data.name, message: data.message, createdAt: new Date(data.created_at) },
        ...prev,
      ]);
      setGbName("");
      setGbMessage("");
    }

    setGbSubmitting(false);
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const accepted = Array.from(files).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );
    if (!accepted.length) return;

    setUploading(true);
    setUploadCount(0);
    setUploadTotal(accepted.length);

    const uploaded: GalleryItem[] = [];

    for (const file of accepted) {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (!error && data) {
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        uploaded.push({
          id: data.path,
          url: publicUrl,
          type: file.type.startsWith("video/") ? "video" : "image",
          name: file.name,
        });
      }

      setUploadCount((n) => n + 1);
    }

    setGalleryItems((prev) => [...uploaded, ...prev]);
    setUploading(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative flex flex-col items-center justify-center overflow-hidden pt-16"
        style={{ minHeight: "min(100svh, 100vh)", backgroundColor: "var(--cream)" }}
      >
        {/* Three.js bokeh layer — lazy loaded */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ scale: heroBgScale }}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <HeroCanvas />
          </Suspense>
        </motion.div>

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 py-10 sm:py-14">
          <motion.img
            src={heroImage}
            alt="Ayman & Nancy — Save the Date, June 6, 2026"
            fetchPriority="high"
            className="w-full h-auto block rounded-2xl shadow-xl"
            style={{ maxWidth: "min(540px, 92vw)", y: heroImageY }}
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
            <button
              onClick={() => document.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-block px-10 py-3.5 rounded-full border border-primary text-primary text-[11px] tracking-[0.28em] uppercase hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-body cursor-pointer"
            >
              Kindly RSVP
            </button>
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
          <p className="font-script text-4xl text-primary mb-2 leading-none" style={{ paddingTop: "4px" }}>
            counting down to forever
          </p>

          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <Ornament />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>

          <div className="flex items-start justify-center gap-6 sm:gap-10 md:gap-14">
            <CountdownUnit value={countdown?.days ?? null} label="Days" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.hours ?? null} label="Hours" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.minutes ?? null} label="Minutes" />
            <span className="text-muted-foreground/30 text-2xl mt-3 select-none font-body font-light">·</span>
            <CountdownUnit value={countdown?.seconds ?? null} label="Seconds" />
          </div>

          <div className="flex items-center gap-4 mt-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <p className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground/70 font-body px-2 whitespace-nowrap">
              June 6, 2026 · Cairo, Egypt
            </p>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </div>
        </motion.div>
      </section>

      {/* ── Venue ── */}
      <section ref={venueRef} className="py-24 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ y: venueMapY }}
            className="relative"
          >
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-border/60" aria-hidden="true" />
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ aspectRatio: "3/4" }}>
              {import.meta.env.VITE_GOOGLE_MAPS_KEY ? (
                <img
                  src={`https://maps.googleapis.com/maps/api/staticmap?center=30.0632,31.2262&zoom=17&size=600x800&maptype=satellite&markers=color:red%7C30.0632,31.2262&scale=2&key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}`}
                  alt="All Saints' Cathedral, Zamalek — satellite view"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src="https://maps.google.com/maps?q=All+Saints+Cathedral,+Zamalek,+Cairo&t=k&z=17&ie=UTF8&iwloc=&output=embed"
                  title="All Saints' Cathedral, Zamalek"
                  className="absolute inset-0 w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
            </div>
          </motion.div>

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
              <span className="text-muted-foreground"> · 7:30 PM</span>
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

      {/* ── RSVP ── */}
      <section ref={rsvpRef} id="rsvp" className="relative py-28 sm:py-32 px-6 overflow-hidden border-t border-border bg-cream-dark/30">
        <motion.img
          src={heroBotanical}
          style={{ y: botanicalY }}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain object-center opacity-[0.06] pointer-events-none select-none"
        />

        <div className="relative z-10 max-w-xl mx-auto">
          <AnimatePresence mode="wait">
            {rsvpSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-center"
              >
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
                <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-4 font-body">
                  {attending === "yes" ? "See you there" : "With love"}
                </p>
                <h2 className="font-heading text-5xl md:text-6xl text-foreground leading-tight">
                  {attending === "yes" ? "You're on the list!" : "We'll miss you."}
                </h2>
                <p className="mt-5 font-serif text-xl text-muted-foreground leading-relaxed">
                  {attending === "yes"
                    ? `Thank you, ${rsvpName}. We're so excited to celebrate with you on June 6, 2026.`
                    : `Thank you, ${rsvpName}. We're sorry you can't make it, but we appreciate you letting us know.`}
                </p>
                <div className="my-8 flex items-center gap-4 max-w-xs mx-auto">
                  <div className="flex-1 h-px bg-border" />
                  <Ornament />
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="font-script text-4xl text-foreground leading-none" style={{ paddingTop: "4px" }}>
                  Ayman &amp; Nancy
                </p>
                <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2 font-body">
                  June 6, 2026 · Zamalek, Cairo
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-center mb-12">
                  <SectionLabel>Kindly reply by May 20, 2026</SectionLabel>
                  <p className="font-script text-5xl text-primary leading-none mb-3" style={{ paddingTop: "4px" }}>
                    Will you join us?
                  </p>
                  <h2 className="font-heading text-5xl md:text-6xl text-foreground">RSVP</h2>
                  <p className="mt-4 font-serif text-xl text-muted-foreground leading-relaxed">
                    We hope you can join us to celebrate our special day
                  </p>
                </div>

                <form onSubmit={handleRsvpSubmit} noValidate className="space-y-0">
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
                            setRsvpErrors((prev) => ({ ...prev, attending: undefined }));
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
                    {rsvpErrors.attending && (
                      <p className="mt-2.5 text-sm text-destructive text-center font-body">{rsvpErrors.attending}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="rsvp-name">
                      Your Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="rsvp-name"
                      type="text"
                      value={rsvpName}
                      onChange={(e) => {
                        setRsvpName(e.target.value);
                        setRsvpErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Full name"
                      className={`w-full rounded-xl border bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body ${
                        rsvpErrors.name ? "border-destructive" : "border-input"
                      }`}
                      maxLength={120}
                    />
                    {rsvpErrors.name && (
                      <p className="mt-1.5 text-sm text-destructive font-body">{rsvpErrors.name}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="rsvp-email">
                      Email <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      id="rsvp-email"
                      type="email"
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body"
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground font-body">
                      We'll send event details to this address
                    </p>
                  </div>

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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-8">
                    <Button
                      type="submit"
                      disabled={rsvpSubmitting}
                      className="w-full h-13 text-sm tracking-[0.2em] uppercase rounded-full cursor-pointer"
                    >
                      <AnimatePresence mode="wait">
                        {rsvpSubmitting ? (
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
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Guestbook ── */}
      <section id="guestbook" className="py-24 sm:py-28 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <SectionLabel>Wishes</SectionLabel>
            <p className="font-script text-5xl text-primary leading-none mb-3" style={{ paddingTop: "4px" }}>
              Leave a message
            </p>
            <h2 className="font-heading text-5xl md:text-6xl text-foreground">Guestbook</h2>
            <p className="mt-4 font-serif text-xl text-muted-foreground leading-relaxed">
              Share your love and wishes for the happy couple
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleGbSubmit}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-card rounded-2xl p-8 shadow-sm border border-border mb-12"
          >
            <div className="mb-6">
              <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="gb-name">
                Your Name
              </label>
              <input
                id="gb-name"
                type="text"
                value={gbName}
                onChange={(e) => setGbName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body"
                maxLength={100}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body" htmlFor="gb-message">
                Your Message
              </label>
              <textarea
                id="gb-message"
                value={gbMessage}
                onChange={(e) => setGbMessage(e.target.value)}
                placeholder="Write your wishes for Ayman & Nancy…"
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors text-base font-body"
                maxLength={500}
                required
              />
              <p className="mt-1.5 text-xs text-muted-foreground text-right font-body">{gbMessage.length}/500</p>
            </div>

            {gbError && (
              <p className="mb-4 text-sm text-destructive font-body" role="alert">{gbError}</p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full text-sm tracking-[0.18em] uppercase cursor-pointer"
              disabled={gbSubmitting}
            >
              {gbSubmitting ? "Sending…" : "Send Wishes"}
            </Button>
          </motion.form>

          {gbLoading ? (
            <div className="space-y-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-2xl p-7 border border-border animate-pulse">
                  <div className="h-4 bg-muted-foreground/15 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-muted-foreground/10 rounded w-full mb-2" />
                  <div className="h-4 bg-muted-foreground/10 rounded w-4/5 mb-5" />
                  <div className="h-3 bg-muted-foreground/08 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-script text-4xl text-primary/60 mb-3 leading-none" style={{ paddingTop: "4px" }}>
                Be the first…
              </p>
              <p className="font-serif text-lg text-muted-foreground">No messages yet — leave your wishes above!</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xs text-muted-foreground text-center tracking-[0.18em] uppercase font-body">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </p>
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                    className="relative bg-card rounded-2xl px-8 py-7 border border-border shadow-sm overflow-hidden"
                  >
                    <span
                      className="absolute top-4 left-5 font-heading text-6xl text-primary/10 leading-none select-none pointer-events-none"
                      aria-hidden="true"
                    >
                      &ldquo;
                    </span>
                    <p className="font-serif text-lg text-foreground leading-relaxed relative z-10 mt-2">
                      {msg.message}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <p className="font-script text-2xl text-primary leading-none" style={{ paddingTop: "3px" }}>
                        {msg.name}
                      </p>
                      <span className="text-xs text-muted-foreground font-body">
                        {msg.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="py-24 sm:py-28 px-6 border-t border-border bg-cream-dark/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <SectionLabel>Memories</SectionLabel>
            <p className="font-script text-5xl text-primary leading-none mb-3" style={{ paddingTop: "4px" }}>
              Captured moments
            </p>
            <h2 className="font-heading text-5xl md:text-6xl text-foreground">Gallery</h2>
            <p className="mt-4 font-serif text-xl text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Share your photos and videos from the celebration
            </p>
          </motion.div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`relative mb-14 border-2 border-dashed rounded-2xl p-14 text-center transition-all duration-200 ${
              dragging
                ? "border-primary bg-sage-light/30 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-5">
                <div className="w-full max-w-xs bg-muted rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadTotal ? (uploadCount / uploadTotal) * 100 : 0}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm text-muted-foreground font-body">
                  Uploading {uploadCount} of {uploadTotal}…
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex justify-center">
                  <div className="w-14 h-14 rounded-full bg-sage-light/50 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-primary">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                </div>
                <p className="font-serif text-lg text-foreground/70 mb-1">
                  Drag &amp; drop photos and videos here
                </p>
                <p className="text-sm text-muted-foreground mb-6 font-body">or browse from your device</p>
                <label>
                  <Button variant="outline" className="cursor-pointer rounded-full text-xs tracking-[0.2em] uppercase font-body" asChild>
                    <span>Browse Files</span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  />
                </label>
              </>
            )}
          </div>

          {galleryLoading && (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="break-inside-avoid rounded-xl bg-muted animate-pulse"
                  style={{ height: `${180 + (i % 3) * 70}px` }}
                />
              ))}
            </div>
          )}

          {galleryFetchError && (
            <div className="text-center py-20">
              <p className="font-serif text-lg text-muted-foreground">
                Couldn't load the gallery. Check your Supabase setup and try refreshing.
              </p>
            </div>
          )}

          {!galleryLoading && !galleryFetchError && galleryItems.length === 0 && (
            <div className="text-center py-20">
              <p className="font-script text-4xl text-primary/60 mb-3 leading-none" style={{ paddingTop: "4px" }}>
                Be the first to share
              </p>
              <p className="font-serif text-lg text-muted-foreground">
                No photos yet — upload your memories above!
              </p>
            </div>
          )}

          {!galleryLoading && galleryItems.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground text-center mb-8 tracking-[0.18em] uppercase font-body">
                {galleryItems.length} {galleryItems.length === 1 ? "photo" : "photos & videos"}
              </p>
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {galleryItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4) }}
                    className="break-inside-avoid cursor-pointer group"
                    onClick={() => setSelectedItem(item)}
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-200"
                      />
                    ) : (
                      <div className="relative rounded-xl overflow-hidden shadow-sm group-hover:shadow-md transition-shadow duration-200">
                        <video src={item.url} className="w-full" muted playsInline preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-foreground/92 flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <button
              className="absolute top-6 right-6 text-background/80 hover:text-background transition-colors cursor-pointer"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
            <a
              href={selectedItem.url}
              download={selectedItem.name}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-6 left-6 text-background/80 hover:text-background transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="Download"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
            {selectedItem.type === "image" ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.name}
                className="max-h-[88vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={selectedItem.url}
                className="max-h-[88vh] max-w-[90vw] rounded-xl shadow-2xl"
                controls
                autoPlay
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <WeddingFooter />
    </div>
  );
}
