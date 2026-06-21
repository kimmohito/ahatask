"use client";

import React, { useState, useEffect } from "react";
import useUiStore from "@/lib/uiStore";
import CreateTaskForm from "./CreateTaskForm";
import { IconX } from "@tabler/icons-react";

export default function CreateTaskModal() {
  const show = useUiStore((s) => s.showCreateTaskModal);
  const setShow = useUiStore((s) => s.setShowCreateTaskModal);
  const [tab, setTab] = useState<'details'|'comments'|'history'>('details');
  const [comments, setComments] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!show) {
      setTab('details');
      setComments([]);
      setHistory([]);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center" onClick={() => setShow(false)}>
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative w-[820px] max-w-full h-[520px] shadow-2xl rounded-lg overflow-hidden bg-white dark:bg-surface p-4" onClick={(e) => e.stopPropagation()}>
        <div className="absolute right-3 top-3">
          <button onClick={() => setShow(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><IconX /></button>
        </div>

        <div className="flex gap-4 h-full">
          <div className="flex-1 overflow-auto">
            <h3 className="text-lg font-semibold mb-2">Create Task</h3>
            <CreateTaskForm onCreated={() => setShow(false)} />
          </div>

          <div style={{ width: 320 }} className="border-l pl-4">
            <div className="flex gap-2 mb-3">
              <button onClick={() => setTab('comments')} className={`px-3 py-1 rounded ${tab==='comments'?'bg-gray-100':''}`}>Comments</button>
              <button onClick={() => setTab('history')} className={`px-3 py-1 rounded ${tab==='history'?'bg-gray-100':''}`}>History</button>
            </div>

            <div className="overflow-auto max-h-[420px]">
              {tab === 'comments' && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">No comments yet — add after creating task.</div>
                </div>
              )}

              {tab === 'history' && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">History will appear here once the task has activity.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
