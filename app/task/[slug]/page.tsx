"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import AppShell from "@/app/components/AppShell";
import CreateTaskForm from "@/app/components/CreateTaskForm";
import useAuthStore from "@/lib/authStore";
import {
  IconBookmark,
  IconBookmarkFilled,
  IconClock,
  IconEdit,
  IconHeart,
  IconHeartFilled,
  IconHistory,
  IconLink,
  IconMessageCircle,
  IconPin,
  IconPinFilled,
  IconShare3,
} from "@tabler/icons-react";

type HistoryItem = {
  description?: string;
  action?: string;
  created_at?: string;
  user_name?: string;
  user?: string;
  actor_name?: string;
  changes?: Array<{ field: string; before: any; after: any }>;
  source?: string;
};

type CommentItem = {
  id?: string | number;
  body?: string;
  comment?: string;
  created_at?: string;
  user_name?: string;
  user?: string;
  actor_name?: string;
};

type TaskChange = { field: string; before: unknown; after: unknown };

function formatDate(input?: string) {
  if (!input) return "";
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return input;
  return dt.toLocaleString();
}

function getUserDisplayName(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const candidate = obj.name ?? obj.username ?? obj.email;
    if (typeof candidate === "string") return candidate;
  }
  return "";
}

export default function TaskDetailPage() {
  const params = useParams() as { slug?: string };
  const router = useRouter();
  const { slug } = params;
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteUsers, setFavoriteUsers] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const username = useAuthStore((s) => s.username);

  const historyKey = useMemo(() => (slug ? `task-history:${slug}` : "task-history"), [slug]);
  const commentsKey = useMemo(() => (slug ? `task-comments:${slug}` : "task-comments"), [slug]);
  const favoritesStorageKey = "task-favorites";
  const bookmarksStorageKey = "task-bookmarks";
  const pinsStorageKey = "task-pins";

  const actorName = useMemo(() => {
    if (username) return username;
    try {
      const token = localStorage.getItem("token");
      if (!token) return "You";
      const parts = token.split(".");
      if (parts.length < 2) return "You";
      const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload?.name || payload?.username || payload?.email || "You";
    } catch {
      return "You";
    }
  }, [username]);

  const addLocalHistory = (entry: HistoryItem) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      try {
        localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        // ignore storage issues
      }
      return next;
    });
  };

  const addLocalComment = (entry: CommentItem) => {
    setComments((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      try {
        localStorage.setItem(commentsKey, JSON.stringify(next));
      } catch {
        // ignore storage issues
      }
      return next;
    });
  };

  const getPersistentList = (key: string): string[] => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
    } catch {
      return [];
    }
  };

  const savePersistentList = (key: string, next: string[]) => {
    try {
      localStorage.setItem(key, JSON.stringify(Array.from(new Set(next.map((v) => String(v))))));
    } catch {
      // ignore storage issues
    }
  };

  const getTaskPinKeys = (): string[] => {
    const keys: string[] = [];
    if (slug) keys.push(String(slug));
    if (task?.id !== undefined && task?.id !== null) keys.push(String(task.id));
    return Array.from(new Set(keys));
  };

  const socialLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl || "");
    const encodedText = encodeURIComponent(task?.title ? `Check this task: ${task.title}` : "Check this task");
    return {
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      x: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };
  }, [shareUrl, task?.title]);

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        router.replace("/browse");
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/api/tasks/${slug}`);
        const loadedTask = res?.data?.data ?? res?.data ?? res?.data?.task ?? null;

        if (!loadedTask) {
          setTask(null);
          router.replace("/browse");
          return;
        }

        setTask(loadedTask);

        const serverFavoriteUsersRaw =
          loadedTask?.favorite_users ?? loadedTask?.liked_by ?? loadedTask?.likes ?? loadedTask?.favorites ?? [];
        const serverFavoriteUsers = Array.isArray(serverFavoriteUsersRaw)
          ? serverFavoriteUsersRaw
              .map((item: unknown) => getUserDisplayName(item))
              .filter((value) => !!value)
          : [];
        if (serverFavoriteUsers.length > 0) {
          setFavoriteUsers(serverFavoriteUsers);
          setIsFavorited(serverFavoriteUsers.includes(actorName));
        }
      } catch {
        setTask(null);
        router.replace("/browse");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShareUrl(window.location.href);

    const bookmarkList = getPersistentList(bookmarksStorageKey);
    const pinList = getPersistentList(pinsStorageKey);
    const favoriteMapRaw = localStorage.getItem(favoritesStorageKey);
    const favoriteMap = favoriteMapRaw ? JSON.parse(favoriteMapRaw) : {};
    const localFavoriteUsersRaw = slug ? favoriteMap?.[String(slug)] : [];
    const localFavoriteUsers = Array.isArray(localFavoriteUsersRaw)
      ? localFavoriteUsersRaw.map((value: unknown) => String(value))
      : [];

    if (slug) {
      setIsBookmarked(bookmarkList.includes(String(slug)));
      setIsPinned(pinList.includes(String(slug)));
      if (favoriteUsers.length === 0 && localFavoriteUsers.length > 0) {
        setFavoriteUsers(localFavoriteUsers);
      }
      if (localFavoriteUsers.length > 0) {
        setIsFavorited(localFavoriteUsers.includes(actorName));
      }
    }
  }, [slug, actorName]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!slug) return;
      setHistoryLoading(true);

      let remote: HistoryItem[] = [];
      try {
        const res = await fetch(`/api/tasks/${slug}/history`);
        const data = await res.json().catch(() => null);
        const list = data?.data ?? data ?? [];
        if (Array.isArray(list)) {
          remote = list;
        }
      } catch {
        remote = [];
      }

      let local: HistoryItem[] = [];
      try {
        const raw = localStorage.getItem(historyKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) local = parsed;
        }
      } catch {
        local = [];
      }

      const merged = [...local, ...remote].filter(Boolean).slice(0, 50);
      setHistory(merged);
      setHistoryLoading(false);
    };

    loadHistory();
  }, [slug, historyKey]);

  useEffect(() => {
    const loadComments = async () => {
      if (!slug) return;
      setCommentsLoading(true);

      let remote: CommentItem[] = [];
      try {
        const res = await fetch(`/api/tasks/${slug}/comments`);
        const data = await res.json().catch(() => null);
        const list = data?.data ?? data ?? [];
        if (Array.isArray(list)) {
          remote = list;
        }
      } catch {
        remote = [];
      }

      let local: CommentItem[] = [];
      try {
        const raw = localStorage.getItem(commentsKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) local = parsed;
        }
      } catch {
        local = [];
      }

      const all = [...remote, ...local];
      const deduped = all.filter((item, index) => {
        const itemKey = `${item.created_at || ""}:${item.body || item.comment || ""}:${item.user_name || item.user || ""}`;
        return (
          index ===
          all.findIndex((candidate) => {
            const candidateKey = `${candidate.created_at || ""}:${candidate.body || candidate.comment || ""}:${candidate.user_name || candidate.user || ""}`;
            return candidateKey === itemKey;
          })
        );
      });

      setComments(deduped.slice(0, 100));
      setCommentsLoading(false);
    };

    loadComments();
  }, [slug, commentsKey]);

  const handleTaskUpdated = (updatedTask: any, changes?: TaskChange[]) => {
    setTask(updatedTask);
    setIsEditing(false);

    const description = changes && changes.length > 0
      ? `Updated ${changes.map((change) => change.field).join(", ")}`
      : "Updated task";

    addLocalHistory({
      description,
      action: "updated",
      created_at: new Date().toISOString(),
      user_name: username || "You",
      actor_name: username || "You",
      changes,
      source: "local",
    });
  };

  const toggleFavorite = async () => {
    if (!slug) return;
    const next = !isFavorited;
    setIsFavorited(next);

    const updatedUsers = next
      ? Array.from(new Set([...favoriteUsers, actorName]))
      : favoriteUsers.filter((name) => name !== actorName);
    setFavoriteUsers(updatedUsers);

    try {
      if (next) {
        await api.post(`/api/tasks/${slug}/favorite`);
      } else {
        await api.delete(`/api/tasks/${slug}/favorite`);
      }
    } catch {
      // fallback to local persistence while backend endpoint is unavailable
    }

    try {
      const raw = localStorage.getItem(favoritesStorageKey);
      const map = raw ? JSON.parse(raw) : {};
      map[String(slug)] = updatedUsers;
      localStorage.setItem(favoritesStorageKey, JSON.stringify(map));
    } catch {
      // ignore storage issues
    }

    addLocalHistory({
      description: next ? "Favorited task" : "Removed favorite",
      action: next ? "favorite" : "unfavorite",
      created_at: new Date().toISOString(),
      user_name: actorName,
      actor_name: actorName,
      source: "local",
    });
  };

  const toggleBookmark = async () => {
    if (!slug) return;
    const next = !isBookmarked;
    setIsBookmarked(next);

    const list = getPersistentList(bookmarksStorageKey);
    const nextList = next ? [...list, String(slug)] : list.filter((item) => item !== String(slug));
    savePersistentList(bookmarksStorageKey, nextList);

    try {
      if (next) {
        await api.post(`/api/tasks/${slug}/bookmark`);
      } else {
        await api.delete(`/api/tasks/${slug}/bookmark`);
      }
    } catch {
      // private bookmark works locally even if backend endpoint is not ready
    }

    addLocalHistory({
      description: next ? "Bookmarked task" : "Removed bookmark",
      action: next ? "bookmark" : "unbookmark",
      created_at: new Date().toISOString(),
      user_name: actorName,
      actor_name: actorName,
      source: "local",
    });
  };

  const togglePin = async () => {
    const keys = getTaskPinKeys();
    if (keys.length === 0) return;

    const next = !isPinned;
    setIsPinned(next);

    const list = getPersistentList(pinsStorageKey);
    const nextSet = new Set(list);
    if (next) {
      keys.forEach((key) => nextSet.add(key));
    } else {
      keys.forEach((key) => nextSet.delete(key));
    }
    savePersistentList(pinsStorageKey, Array.from(nextSet));

    if (slug) {
      try {
        if (next) {
          await api.post(`/api/tasks/${slug}/pin`);
        } else {
          await api.delete(`/api/tasks/${slug}/pin`);
        }
      } catch {
        // pin still works locally for ordering if backend endpoint is not ready
      }
    }

    addLocalHistory({
      description: next ? "Pinned task" : "Unpinned task",
      action: next ? "pin" : "unpin",
      created_at: new Date().toISOString(),
      user_name: actorName,
      actor_name: actorName,
      source: "local",
    });
  };

  const submitComment = async () => {
    if (!slug || !commentDraft.trim() || commentSubmitting) return;
    const body = commentDraft.trim();
    setCommentSubmitting(true);

    const optimisticEntry: CommentItem = {
      body,
      created_at: new Date().toISOString(),
      user_name: actorName,
    };

    try {
      const res = await api.post(`/api/tasks/${slug}/comments`, { body });
      const saved = res?.data?.data ?? res?.data ?? optimisticEntry;
      const savedEntry = Array.isArray(saved) ? (saved[0] as CommentItem) : (saved as CommentItem);
      addLocalComment(savedEntry || optimisticEntry);
    } catch {
      addLocalComment(optimisticEntry);
    } finally {
      setCommentDraft("");
      setCommentSubmitting(false);
    }
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  if (loading) return <div>Loading task...</div>;
  if (!task) return null;

  return (
    <AppShell>
      <div className="w-full min-w-0 px-3 md:px-5 py-3 space-y-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                <IconEdit size={14} />
                {isEditing ? "Editing" : "View Task"}
              </div>
              <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{task.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Status: {task.status || "-"}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Priority: {task.priority || "-"}</span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1">Assignee: {task.assignee_name || task.assignee?.name || "Unassigned"}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <IconClock size={14} />
                <span>{formatDate(task.updated_at || task.created_at || "")}</span>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isFavorited ? <IconHeartFilled size={14} className="text-rose-500" /> : <IconHeart size={14} />}
                  <span>{favoriteUsers.length}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleBookmark}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isBookmarked ? <IconBookmarkFilled size={14} className="text-indigo-500" /> : <IconBookmark size={14} />}
                  Bookmark
                </button>

                <button
                  type="button"
                  onClick={togglePin}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isPinned ? <IconPinFilled size={14} className="text-amber-500" /> : <IconPin size={14} />}
                  Pin
                </button>

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <IconShare3 size={14} />
                  Share
                </button>

                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-3 py-1.5 text-xs"
                  >
                    Cancel Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs"
                  >
                    <IconEdit size={14} />
                    Edit
                  </button>
                )}
              </div>
            </div>
          </div>

          {favoriteUsers.length > 0 && (
            <div className="rounded-lg bg-rose-50/70 dark:bg-rose-900/20 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
              Liked by: {favoriteUsers.join(", ")}
            </div>
          )}

          {isEditing ? (
            <CreateTaskForm mode="edit" task={task} onUpdated={handleTaskUpdated} />
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </div>
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                <div>Reporter: {task.reporter_name || task.reporter?.name || "-"}</div>
                <div>Task ID: {task.slug || task.id || slug || "-"}</div>
                <div>Created: {formatDate(task.created_at)}</div>
                <div>Updated: {formatDate(task.updated_at)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {activeTab === "comments" ? (
                <IconMessageCircle size={16} className="text-gray-500 dark:text-gray-400" />
              ) : (
                <IconHistory size={16} className="text-gray-500 dark:text-gray-400" />
              )}
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {activeTab === "comments" ? "Comments" : "Task History"}
              </h2>
            </div>

            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1">
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-2.5 py-1 text-xs rounded ${activeTab === "comments" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300"}`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-2.5 py-1 text-xs rounded ${activeTab === "history" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300"}`}
              >
                Activity Log
              </button>
            </div>
          </div>

          {activeTab === "comments" ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                <label className="text-xs text-gray-500 dark:text-gray-400">Add comment</label>
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Write your comment here..."
                  className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={submitComment}
                    disabled={!commentDraft.trim() || commentSubmitting}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs disabled:opacity-50"
                  >
                    {commentSubmitting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </div>

              {commentsLoading ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((entry, index) => (
                    <div key={`${entry.created_at || index}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.user_name || entry.actor_name || entry.user || "Unknown user"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.created_at)}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {entry.body || entry.comment || ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : historyLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No activity yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div key={`${entry.created_at || index}-${index}`} className="rounded-lg border border-gray-200 dark:border-gray-800 px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {entry.description || entry.action || "Activity"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.created_at)}
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {entry.user_name || entry.actor_name || entry.user || "System"}
                  </div>
                  {Array.isArray(entry.changes) && entry.changes.length > 0 && (
                    <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      {entry.changes.map((change) => (
                        <div key={change.field} className="rounded bg-gray-50 dark:bg-gray-800 px-2 py-1">
                          <span className="font-medium capitalize">{change.field}</span>
                          <span className="mx-1">:</span>
                          <span>{String(change.before ?? "-")}</span>
                          <span className="mx-1">→</span>
                          <span>{String(change.after ?? "-")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {shareOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center" onClick={() => setShareOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-130 max-w-[95vw] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share Task</h3>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="text-xs rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1"
              >
                Close
              </button>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm break-all">
              {shareUrl}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 text-white px-3 py-1.5 text-xs"
              >
                <IconLink size={14} />
                {copied ? "Copied" : "Copy link"}
              </button>
              <a
                href={socialLinks.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs"
              >
                WhatsApp
              </a>
              <a
                href={socialLinks.x}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs"
              >
                X / Twitter
              </a>
              <a
                href={socialLinks.facebook}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
