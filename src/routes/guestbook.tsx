import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/guestbook")({
  head: () => ({
    meta: [
      { title: "Guestbook — Nancy & Nabil" },
      { name: "description", content: "Leave your wishes and messages for Nancy & Nabil." },
      { property: "og:title", content: "Guestbook — Nancy & Nabil" },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setMessages((prev) => [
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        message: message.trim(),
        createdAt: new Date(),
      },
      ...prev,
    ]);
    setName("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      <div className="pt-24 pb-12 px-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Wishes</p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">Guestbook</h1>
          <p className="mt-4 text-muted-foreground">
            Leave a message for the happy couple
          </p>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-card rounded-xl p-8 shadow-sm border border-border mb-12"
        >
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              maxLength={100}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Your Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your wishes for Nancy & Nabil..."
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              maxLength={500}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Send Wishes
          </Button>
        </motion.form>

        {/* Messages */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No messages yet — be the first to leave your wishes!</p>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-sage-light/30 rounded-xl p-6 border border-border"
            >
              <p className="text-foreground leading-relaxed">{msg.message}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-heading text-lg text-foreground">{msg.name}</span>
                <span className="text-sm text-muted-foreground">
                  {msg.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <WeddingFooter />
    </div>
  );
}
