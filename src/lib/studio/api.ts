"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProgressReport } from "@/lib/content/completion";
import type { ContentReport } from "@/lib/content/report";
import type { ContentTypeId, Entry, EntryData, MediaRef } from "@/lib/content/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: Record<string, unknown>,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    });
  } catch {
    throw new ApiError("You appear to be offline. Check your connection and try again.", 0, {});
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && typeof window !== "undefined") {
    // Session expired — hard redirect so no stale private data stays in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/content-studio/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiError(String(body.error ?? "Something went wrong"), res.status, body);
  return body as T;
}

export interface MediaItem extends MediaRef {
  provider: "local" | "cloudinary";
  folder: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Overview {
  progress: ProgressReport;
  newEnquiries: number;
  mediaCount: number;
  storage: "local" | "cloudinary";
  unpublishedChanges: number;
  lastSubmission: { id: string; createdAt: string; percent: number } | null;
}

export interface Enquiry {
  id: string;
  kind: "business" | "collaboration" | "general";
  name: string;
  email: string;
  phone?: string;
  organisation?: string;
  subject?: string;
  service?: string;
  budget?: string;
  timeline?: string;
  message: string;
  status: "new" | "read" | "archived";
  createdAt: string;
}

export interface Submission {
  id: string;
  note: string;
  submittedBy: string;
  percent: number;
  completed: number;
  totalSections: number;
  missingRequired: number;
  createdAt: string;
}

export const qk = {
  entries: ["entries"] as const,
  overview: ["overview"] as const,
  media: ["media"] as const,
  enquiries: ["enquiries"] as const,
  submissions: ["submissions"] as const,
  report: ["report"] as const,
};

/* ---------------------------------------------------------------- queries */

export function useEntries() {
  return useQuery({
    queryKey: qk.entries,
    queryFn: () => api<{ entries: Entry[] }>("/api/studio/entries").then((r) => r.entries),
  });
}

export function useOverview() {
  return useQuery({ queryKey: qk.overview, queryFn: () => api<Overview>("/api/studio/overview") });
}

export function useMedia() {
  return useQuery({
    queryKey: qk.media,
    queryFn: () =>
      api<{ media: MediaItem[]; provider: "local" | "cloudinary"; rules: Record<string, { mimes: string[]; maxBytes: number; label: string }> }>(
        "/api/studio/media",
      ),
  });
}

export function useEnquiries() {
  return useQuery({ queryKey: qk.enquiries, queryFn: () => api<{ enquiries: Enquiry[] }>("/api/studio/enquiries").then((r) => r.enquiries) });
}

export function useSubmissions() {
  return useQuery({ queryKey: qk.submissions, queryFn: () => api<{ submissions: Submission[] }>("/api/studio/submissions").then((r) => r.submissions) });
}

export function useReport() {
  return useQuery({ queryKey: qk.report, queryFn: () => api<{ report: ContentReport }>("/api/studio/report").then((r) => r.report) });
}

/* -------------------------------------------------------------- mutations */

function useInvalidateContent() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: qk.entries }), qc.invalidateQueries({ queryKey: qk.overview }), qc.invalidateQueries({ queryKey: qk.report })]);
}

/** Write a fresh entry into the cache immediately (keeps the editor in sync without a refetch flash). */
function usePutEntry() {
  const qc = useQueryClient();
  return (entry: Entry) =>
    qc.setQueryData<Entry[]>(qk.entries, (old) => {
      if (!old) return [entry];
      const i = old.findIndex((e) => e.id === entry.id);
      if (i === -1) return [...old, entry];
      const copy = old.slice();
      copy[i] = entry;
      return copy;
    });
}

export function useSaveEntry() {
  const invalidate = useInvalidateContent();
  const put = usePutEntry();
  return useMutation({
    mutationFn: ({ id, type, data }: { id?: string; type: ContentTypeId; data: EntryData }) =>
      id
        ? api<{ entry: Entry }>(`/api/studio/entries/${id}`, { method: "PATCH", body: JSON.stringify({ data }) })
        : api<{ entry: Entry }>(`/api/studio/entries`, { method: "POST", body: JSON.stringify({ type, data }) }),
    onSuccess: ({ entry }) => {
      put(entry);
      void invalidate();
    },
  });
}

export function useEntryAction() {
  const invalidate = useInvalidateContent();
  const put = usePutEntry();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "publish" | "unpublish" | "duplicate" | "revert" | "delete" }) => {
      switch (action) {
        case "publish":
          return api<{ entry: Entry }>(`/api/studio/entries/${id}/publish`, { method: "POST" });
        case "unpublish":
          return api<{ entry: Entry }>(`/api/studio/entries/${id}/publish`, { method: "DELETE" });
        case "duplicate":
          return api<{ entry: Entry }>(`/api/studio/entries/${id}/duplicate`, { method: "POST" });
        case "revert":
          return api<{ entry: Entry }>(`/api/studio/entries/${id}/revert`, { method: "POST" });
        case "delete":
          await api(`/api/studio/entries/${id}`, { method: "DELETE" });
          qc.setQueryData<Entry[]>(qk.entries, (old) => old?.filter((e) => e.id !== id));
          return { entry: null };
      }
    },
    onSuccess: (res) => {
      if (res?.entry) put(res.entry);
      void invalidate();
      void qc.invalidateQueries({ queryKey: qk.media });
    },
  });
}

export function useReorder() {
  const qc = useQueryClient();
  const invalidate = useInvalidateContent();
  return useMutation({
    mutationFn: ({ type, ids }: { type: ContentTypeId; ids: string[] }) =>
      api("/api/studio/entries/reorder", { method: "POST", body: JSON.stringify({ type, ids }) }),
    onMutate: ({ ids }) => {
      qc.setQueryData<Entry[]>(qk.entries, (old) => old?.map((e) => (ids.includes(e.id) ? { ...e, order: ids.indexOf(e.id) } : e)));
    },
    onSettled: () => void invalidate(),
  });
}
