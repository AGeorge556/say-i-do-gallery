import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER ?? "";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS ?? "";
const SESSION_KEY = "admin_auth";
const BUCKET = "wedding-gallery";

interface GuestMessage {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

interface GalleryItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
}

function isVideo(name: string) {
  return /\.(mp4|mov|webm|avi|mkv)$/i.test(name);
}

function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"guestbook" | "gallery">("guestbook");

  const [messages, setMessages] = useState<GuestMessage[]>([]);
  const [gbLoading, setGbLoading] = useState(false);
  const [gbDeleting, setGbDeleting] = useState<string | null>(null);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryDeleting, setGalleryDeleting] = useState<string | null>(null);

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<"guestbook" | "gallery" | null>(null);

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      setLoginError("");
    } else {
      setLoginError("Incorrect username or password.");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setUsername("");
    setPassword("");
  };

  const fetchMessages = useCallback(async () => {
    setGbLoading(true);
    const { data } = await supabase
      .from("guestbook_messages")
      .select("id, name, message, created_at")
      .order("created_at", { ascending: false });
    if (data) setMessages(data as GuestMessage[]);
    setGbLoading(false);
  }, []);

  const fetchGallery = useCallback(async () => {
    setGalleryLoading(true);
    const { data } = await supabase.storage
      .from(BUCKET)
      .list("", { sortBy: { column: "created_at", order: "desc" }, limit: 200 });
    if (data) {
      const files = data.filter((f) => f.name !== ".emptyFolderPlaceholder");
      setItems(
        files.map((file) => {
          const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(file.name);
          return {
            id: file.id ?? file.name,
            name: file.name,
            url: publicUrl,
            type: isVideo(file.name) ? "video" : "image",
          };
        })
      );
    }
    setGalleryLoading(false);
  }, []);

  useEffect(() => {
    if (authed) {
      fetchMessages();
      fetchGallery();
    }
  }, [authed, fetchMessages, fetchGallery]);

  const askConfirm = (id: string, type: "guestbook" | "gallery") => {
    setConfirmId(id);
    setConfirmType(type);
  };

  const cancelConfirm = () => {
    setConfirmId(null);
    setConfirmType(null);
  };

  const confirmDelete = async () => {
    if (!confirmId || !confirmType) return;
    const id = confirmId;
    const type = confirmType;
    cancelConfirm();

    if (type === "guestbook") {
      setGbDeleting(id);
      await supabase.from("guestbook_messages").delete().eq("id", id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setGbDeleting(null);
    } else {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setGalleryDeleting(id);
      await supabase.storage.from(BUCKET).remove([item.name]);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setGalleryDeleting(null);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-10">
            <p
              className="font-script text-5xl text-foreground leading-none mb-3"
              style={{ paddingTop: "4px" }}
            >
              A &amp; N
            </p>
            <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground font-body">
              Admin Access
            </p>
          </div>

          <form onSubmit={login} className="space-y-5">
            <div>
              <label
                className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body"
                htmlFor="admin-user"
              >
                Username
              </label>
              <input
                id="admin-user"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                placeholder="Username"
                autoComplete="username"
                className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body"
              />
            </div>
            <div>
              <label
                className="block text-xs font-medium text-foreground mb-2 tracking-wide uppercase font-body"
                htmlFor="admin-pass"
              >
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-colors text-base font-body"
              />
            </div>

            {loginError && (
              <p className="text-sm text-destructive font-body">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] tracking-[0.28em] uppercase hover:bg-primary/90 transition-all duration-200 font-body cursor-pointer"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <p
            className="font-script text-2xl text-foreground leading-none"
            style={{ paddingTop: "4px" }}
          >
            Admin
          </p>
          <button
            onClick={logout}
            className="text-xs tracking-[0.22em] uppercase text-muted-foreground hover:text-foreground transition-colors font-body cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Tabs */}
        <div className="flex gap-1 mb-10 bg-muted/50 rounded-xl p-1 w-fit">
          {(["guestbook", "gallery"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-lg text-xs tracking-[0.18em] uppercase font-body transition-all duration-200 cursor-pointer ${
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "guestbook"
                ? `Guestbook (${messages.length})`
                : `Gallery (${items.length})`}
            </button>
          ))}
        </div>

        {/* ── Guestbook ── */}
        {tab === "guestbook" && (
          <AnimatePresence mode="wait">
            {gbLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card rounded-2xl p-6 border border-border animate-pulse h-24"
                  />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <p className="text-muted-foreground font-serif text-lg text-center py-20">
                No guestbook messages yet.
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.25 }}
                    className="bg-card rounded-2xl px-6 py-5 border border-border flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <p
                          className="font-script text-xl text-primary leading-none"
                          style={{ paddingTop: "2px" }}
                        >
                          {msg.name}
                        </p>
                        <span className="text-xs text-muted-foreground font-body">
                          {new Date(msg.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="font-serif text-base text-foreground/80 leading-relaxed line-clamp-3">
                        {msg.message}
                      </p>
                    </div>
                    <button
                      onClick={() => askConfirm(msg.id, "guestbook")}
                      disabled={gbDeleting === msg.id}
                      aria-label="Delete message"
                      className="flex-shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {gbDeleting === msg.id ? (
                        <svg
                          className="animate-spin"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* ── Gallery ── */}
        {tab === "gallery" && (
          <AnimatePresence mode="wait">
            {galleryLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-muted-foreground font-serif text-lg text-center py-20">
                No gallery items yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.25 }}
                    className="relative group rounded-xl overflow-hidden aspect-square bg-muted"
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-colors duration-200 flex items-center justify-center">
                      <button
                        onClick={() => askConfirm(item.id, "gallery")}
                        disabled={galleryDeleting === item.id}
                        aria-label="Delete item"
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-destructive/90 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
                      >
                        {galleryDeleting === item.id ? (
                          <svg
                            className="animate-spin"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                          </svg>
                        ) : (
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {item.type === "video" && (
                      <div className="absolute bottom-2 left-2 bg-black/50 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="white"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-6"
            onClick={cancelConfirm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ duration: 0.2 }}
              className="bg-card rounded-2xl p-8 shadow-2xl border border-border max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-2xl text-foreground mb-2">
                Delete this?
              </h3>
              <p className="font-body text-sm text-muted-foreground mb-8">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={cancelConfirm}
                  className="flex-1 py-3 rounded-full border border-border text-foreground text-xs tracking-[0.18em] uppercase font-body hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-full bg-destructive text-white text-xs tracking-[0.18em] uppercase font-body hover:bg-destructive/90 transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
