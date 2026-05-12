import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/guestbook")({
  head: () => ({
    meta: [
      { title: "Guestbook — Nancy Nabil & Ayman Ayad" },
      { name: "description", content: "Leave your wishes and messages for Nancy Nabil & Ayman Ayad." },
      { property: "og:title", content: "Guestbook — Nancy Nabil & Ayman Ayad" },
      { property: "og:description", content: "Share your love and wishes for the happy couple." },
    ],
  }),
  component: GuestbookPage,
});

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  createdAt: Date;
}

function GuestbookPage() {
  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("guestbook_messages")
      .insert({ name: name.trim(), message: message.trim() })
      .select()
      .single();

    if (insertError) {
      setError("Something went wrong. Please try again.");
    } else if (data) {
      setMessages((prev) => [
        { id: data.id, name: data.name, message: data.message, createdAt: new Date(data.created_at) },
        ...prev,
      ]);
      setName("");
      setMessage("");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      <div className="pt-24 pb-12 px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-4 font-body">
            Wishes
          </p>
          <p
            className="font-script text-5xl text-primary leading-none mb-3"
            style={{ paddingTop: "4px" }}
          >
            Leave a message
          </p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">Guestbook</h1>
          <p className="mt-4 font-serif text-xl text-muted-foreground leading-relaxed">
            Share your love and wishes for the happy couple
          </p>
        </motion.div>

        {/* Form card */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes for Nancy & Ayman…"
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors text-base font-body"
              maxLength={500}
              required
            />
            <p className="mt-1.5 text-xs text-muted-foreground text-right font-body">{message.length}/500</p>
          </div>

          {error && (
            <p className="mb-4 text-sm text-destructive font-body" role="alert">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full rounded-full text-sm tracking-[0.18em] uppercase cursor-pointer"
            disabled={submitting}
          >
            {submitting ? "Sending…" : "Send Wishes"}
          </Button>
        </motion.form>

        {/* Messages */}
        {loading ? (
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
            <p
              className="font-script text-4xl text-primary/60 mb-3 leading-none"
              style={{ paddingTop: "4px" }}
            >
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
                  {/* Decorative quote mark */}
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
                    <p
                      className="font-script text-2xl text-primary leading-none"
                      style={{ paddingTop: "3px" }}
                    >
                      {msg.name}
                    </p>
                    <span className="text-xs text-muted-foreground font-body">
                      {msg.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <WeddingFooter />
    </div>
  );
}
