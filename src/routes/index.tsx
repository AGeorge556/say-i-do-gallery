import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import heroBotanical from "@/assets/hero-botanical.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nancy & Nabil — June 6, 2026" },
      { name: "description", content: "Join us to celebrate the wedding of Nancy & Nabil on June 6, 2026 at All Saints' Cathedral, Zamalek." },
      { property: "og:title", content: "Nancy & Nabil — Wedding" },
      { property: "og:description", content: "Celebrate love with Nancy & Nabil. June 6, 2026." },
    ],
  }),
  component: HomePage,
});

const schedule = [
  { time: "3:00 PM", event: "Ceremony", detail: "All Saints' Cathedral, Zamalek" },
  { time: "5:00 PM", event: "Cocktail Hour", detail: "Garden reception begins" },
  { time: "7:00 PM", event: "Dinner & Dancing", detail: "Celebration continues into the night" },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-cream opacity-50" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src={heroBotanical}
              alt="Botanical wreath decoration"
              width={600}
              height={340}
              className="mx-auto w-full max-w-lg"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Together with their families
            </p>
            <h1 className="font-heading text-6xl md:text-8xl text-foreground leading-tight">
              Nancy<br />
              <span className="text-3xl md:text-4xl text-muted-foreground italic font-body font-light">&amp;</span><br />
              Nabil
            </h1>
            <p className="mt-6 text-lg tracking-widest uppercase text-primary">
              June 6, 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">The Ceremony</p>
            <h2 className="font-heading text-4xl md:text-5xl text-foreground">All Saints' Cathedral</h2>
            <p className="mt-4 text-muted-foreground text-lg">Zamalek, Cairo</p>
            <div className="mt-8 w-16 h-px bg-primary mx-auto" />
          </motion.div>
        </div>
      </section>

      {/* Schedule */}
      <section className="py-24 px-6 bg-sage-light/40">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">The Day</p>
            <h2 className="font-heading text-4xl md:text-5xl text-foreground">Schedule</h2>
          </motion.div>

          <div className="space-y-12">
            {schedule.map((item, i) => (
              <motion.div
                key={item.event}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex items-start gap-8"
              >
                <span className="text-primary font-heading text-2xl min-w-[100px] text-right">
                  {item.time}
                </span>
                <div className="pt-1">
                  <div className="w-2 h-2 rounded-full bg-primary mb-2" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-foreground">{item.event}</h3>
                  <p className="text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <WeddingFooter />
    </div>
  );
}
