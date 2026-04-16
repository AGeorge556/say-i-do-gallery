import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Nancy & Nabil" },
      { name: "description", content: "Browse and upload photos & videos from Nancy & Nabil's wedding day." },
      { property: "og:title", content: "Wedding Gallery — Nancy & Nabil" },
      { property: "og:description", content: "All the memories from the big day." },
    ],
  }),
  component: GalleryPage,
});

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const handleFiles = useCallback((files: FileList) => {
    const newItems: GalleryItem[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
        newItems.push({
          id: crypto.randomUUID(),
          url: URL.createObjectURL(file),
          type: file.type.startsWith("image/") ? "image" : "video",
          name: file.name,
        });
      }
    });
    setItems((prev) => [...newItems, ...prev]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="min-h-screen bg-background">
      <WeddingNav />

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">Memories</p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">Gallery</h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Share your photos and videos from the celebration
          </p>
        </div>

        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative mb-12 border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragging
              ? "border-primary bg-sage-light/40"
              : "border-border hover:border-primary/50"
          }`}
        >
          <svg
            className="mx-auto mb-4 text-muted-foreground"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-muted-foreground mb-4">Drag & drop photos and videos here</p>
          <label>
            <Button variant="outline" className="cursor-pointer" asChild>
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
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No photos yet — be the first to share!</p>
          </div>
        )}

        {/* Masonry grid */}
        {items.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => setSelectedItem(item)}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    className="w-full rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                  />
                ) : (
                  <video
                    src={item.url}
                    className="w-full rounded-lg shadow-sm"
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-6"
            onClick={() => setSelectedItem(null)}
          >
            <button
              className="absolute top-6 right-6 text-background hover:opacity-75"
              onClick={() => setSelectedItem(null)}
              aria-label="Close"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>

            <a
              href={selectedItem.url}
              download={selectedItem.name}
              className="absolute top-6 left-6 text-background hover:opacity-75"
              onClick={(e) => e.stopPropagation()}
              aria-label="Download"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>

            {selectedItem.type === "image" ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.name}
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <video
                src={selectedItem.url}
                className="max-h-[85vh] max-w-[90vw] rounded-lg"
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
