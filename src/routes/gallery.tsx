import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingNav } from "@/components/WeddingNav";
import { WeddingFooter } from "@/components/WeddingFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Nancy Nabil & Ayman Ayad" },
      { name: "description", content: "Browse and upload photos & videos from Nancy Nabil & Ayman Ayad's wedding day." },
      { property: "og:title", content: "Wedding Gallery — Nancy Nabil & Ayman Ayad" },
      { property: "og:description", content: "All the memories from the big day." },
    ],
  }),
  component: GalleryPage,
});

const BUCKET = "wedding-gallery";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  name: string;
}

function isVideo(name: string) {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(name);
}

function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    async function loadGallery() {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { sortBy: { column: "created_at", order: "desc" }, limit: 200 });

      if (error || !data) {
        setFetchError(true);
        setLoading(false);
        return;
      }

      const files = data.filter((f) => f.name !== ".emptyFolderPlaceholder");
      const mapped: GalleryItem[] = files.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(file.name);
        return {
          id: file.id ?? file.name,
          url: publicUrl,
          type: isVideo(file.name) ? "video" : "image",
          name: file.name,
        };
      });

      setItems(mapped);
      setLoading(false);
    }

    loadGallery();
  }, []);

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
        const { data: { publicUrl } } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(data.path);

        uploaded.push({
          id: data.path,
          url: publicUrl,
          type: file.type.startsWith("video/") ? "video" : "image",
          name: file.name,
        });
      }

      setUploadCount((n) => n + 1);
    }

    setItems((prev) => [...uploaded, ...prev]);
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

      <div className="pt-24 pb-12 px-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground mb-4 font-body">
            Memories
          </p>
          <p
            className="font-script text-5xl text-primary leading-none mb-3"
            style={{ paddingTop: "4px" }}
          >
            Captured moments
          </p>
          <h1 className="font-heading text-5xl md:text-6xl text-foreground">Gallery</h1>
          <p className="mt-4 font-serif text-xl text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Share your photos and videos from the celebration
          </p>
        </motion.div>

        {/* Upload area */}
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

        {/* Loading skeletons */}
        {loading && (
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

        {/* Error state */}
        {fetchError && (
          <div className="text-center py-20">
            <p className="font-serif text-lg text-muted-foreground">
              Couldn't load the gallery. Check your Supabase setup and try refreshing.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && items.length === 0 && (
          <div className="text-center py-20">
            <p
              className="font-script text-4xl text-primary/60 mb-3 leading-none"
              style={{ paddingTop: "4px" }}
            >
              Be the first to share
            </p>
            <p className="font-serif text-lg text-muted-foreground">
              No photos yet — upload your memories above!
            </p>
          </div>
        )}

        {/* Masonry grid */}
        {!loading && items.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground text-center mb-8 tracking-[0.18em] uppercase font-body">
              {items.length} {items.length === 1 ? "photo" : "photos & videos"}
            </p>
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
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

      {/* Lightbox */}
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
