"use client";

import React, { useState, useEffect, useCallback } from "react";
import useUiStore from "@/lib/uiStore";
import CreateTaskForm from "./CreateTaskForm";
import { IconX, IconUser, IconClock } from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";

export default function CreateTaskModal() {
  const show = useUiStore((s) => s.showCreateTaskModal);
  const setShow = useUiStore((s) => s.setShowCreateTaskModal);
  const [tab, setTab] = useState<'details'|'comments'|'history'>('details');
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [storedTask, setStoredTask] = useState<any | null>(null);
  const [formSubmitFn, setFormSubmitFn] = useState<(() => Promise<void>) | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const registerSubmit = useCallback((fn: () => Promise<void>) => setFormSubmitFn(() => fn), [setFormSubmitFn]);

  useEffect(() => {
    if (!show) {
      setTab('details');
      setComments([]);
      setHistory([]);
      setStoredTask(null);
      // remove ?task from url when modal closed
      try {
        router.replace(pathname);
      } catch (e) {}
    }
  }, [show]);

  // fetch comments & history when storedTask is available
  useEffect(() => {
    if (!storedTask?.slug) return;
    const slug = storedTask.slug;
    const load = async () => {
      try {
        const c = await fetch(`/api/tasks/${slug}/comments`).then(r => r.json()).catch(() => null);
        const h = await fetch(`/api/tasks/${slug}/history`).then(r => r.json()).catch(() => null);
        setComments(c?.data ?? c ?? []);
        setHistory(h?.data ?? h ?? []);
      } catch (e) {
        setComments([]);
        setHistory([]);
      }
    };
    load();
    // update query param
    try {
      router.replace(`${pathname}?task=${storedTask.slug}`);
    } catch (e) {}
  }, [storedTask?.slug]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" onClick={() => setShow(false)}>
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-[720px] max-w-full max-h-[90vh] shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {storedTask?.slug && (
            <button onClick={() => router.push(`/task/${storedTask.slug}`)} className="px-2 py-1 text-sm rounded hover:bg-gray-100">Expand</button>
          )}
          <button onClick={() => { setShow(false); }} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><IconX /></button>
        </div>

        <div className="flex flex-col">
          <div className="overflow-auto p-2 max-h-[70vh]">
            {!storedTask ? (
              <>
                <h3 className="text-xl font-semibold mb-3">Create Task</h3>
                <CreateTaskForm hideSubmit onRegisterSubmit={registerSubmit} onStored={(task) => {
                  setStoredTask(task);
                  setTab('comments');
                }} />
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold truncate">{storedTask.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <div className="text-[color:var(--muted)]">Reporter: <strong className="text-[color:var(--foreground)]">{storedTask.reporter_name || storedTask.reporter || 'Unknown'}</strong></div>
                      <div className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700">Priority: <strong className="ml-1">{storedTask.priority}</strong></div>
                      <div className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700">{storedTask.status}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end text-sm text-[color:var(--muted)]">
                      <div className="flex items-center gap-1"><IconClock size={14} /> <span className="text-xs">{storedTask.due_date ?? ''}</span></div>
                    </div>
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 text-white text-sm">{(storedTask.assignee_name || storedTask.assignee || 'U').slice(0,1).toUpperCase()}</div>
                  </div>
                </div>

                <div className="mb-3 text-sm text-[color:var(--foreground)] whitespace-pre-wrap">{storedTask.description}</div>
              </div>
            )}
          </div>

          {storedTask && (
            <div className="border-t pt-3" style={{ height: 220 }}>
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setTab('comments')} className={`px-3 py-1 rounded ${tab==='comments'?'bg-gray-100':''}`}>Comments</button>
                <button onClick={() => setTab('history')} className={`px-3 py-1 rounded ${tab==='history'?'bg-gray-100':''}`}>History</button>
              </div>

              <div className="overflow-auto h-[calc(100%_-_36px)]">
                {tab === 'comments' && (
                  <div>
                    {comments.length === 0 ? (
                      <div className="text-sm text-gray-500">No comments yet.</div>
                    ) : (
                      comments.map((c: any, i: number) => (
                        <div key={i} className="mb-2 border-b pb-2">
                          <div className="text-sm font-medium">{c.user_name || c.user || 'Unknown'}</div>
                          <div className="text-sm text-[color:var(--muted)]">{c.body}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {tab === 'history' && (
                  <div>
                    {history.length === 0 ? (
                      <div className="text-sm text-gray-500">No activity yet.</div>
                    ) : (
                      history.map((h: any, i: number) => (
                        <div key={i} className="mb-2 border-b pb-2">
                          <div className="text-sm font-medium">{h.description || h.action}</div>
                          <div className="text-sm text-[color:var(--muted)]">{h.created_at}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer: compact controls always visible to avoid large whitespace */}
          <div className="border-t pt-3 pb-2 mt-2 flex items-center justify-end gap-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setShow(false)} className="px-3 py-1 rounded text-sm hover:bg-gray-100">Cancel</button>
              {!storedTask && (
                <button onClick={() => { if (formSubmitFn) formSubmitFn(); }} className="px-3 py-1 rounded text-sm bg-indigo-600 text-white">Create Task</button>
              )}
              {storedTask && (
                <button onClick={() => setShow(false)} className="px-3 py-1 rounded text-sm bg-gray-100">Done</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
