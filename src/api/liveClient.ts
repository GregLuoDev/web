import type { ApiClient } from "./types";
import type { ErrorCode, ErrorResponse } from "@shared/types/api";
import type { Question, QuestionInput, QuestionListResponse } from "@/types/question";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new ApiError(
      payload?.error.message ?? `Request failed with status ${response.status}.`,
      response.status,
      payload?.error.code ?? "INTERNAL_ERROR",
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function stateOverride(): "data" | "loading" | "empty" | "error" {
  if (process.env.NODE_ENV !== "development" || typeof window === "undefined") return "data";
  const state = new URLSearchParams(window.location.search).get("previewState")
    ?? window.localStorage.getItem("previewState");
  return state === "loading" || state === "empty" || state === "error" ? state : "data";
}

function neverResolves<T>(): Promise<T> {
  return new Promise<T>(() => undefined);
}

function throwForPreviewState(): "data" | "empty" | "loading" {
  const state = stateOverride();
  if (state === "loading") return "loading";
  if (state === "error") throw new Error("We couldn't load the question bank.");
  return state;
}

export const liveClient: ApiClient = {
  async listQuestions(search = "", subject = "All", page = 1, pageSize = 25): Promise<QuestionListResponse> {
    const state = throwForPreviewState();
    if (state === "loading") return neverResolves();
    if (state === "empty") return { items: [], total: 0, page, pageSize };
    const params = new URLSearchParams({ q: search, page: String(page), pageSize: String(pageSize) });
    if (subject && subject !== "All") params.set("subject", subject);
    return request<QuestionListResponse>(`/api/questions?${params.toString()}`);
  },
  async getQuestion(id: number): Promise<Question> {
    const state = throwForPreviewState();
    if (state === "loading") return neverResolves();
    if (state === "empty") throw new Error("No question is available in the empty preview state.");
    const data = await request<{ question: Question }>(`/api/questions/${id}`);
    return data.question;
  },
  async createQuestion(input: QuestionInput): Promise<Question> {
    const data = await request<{ question: Question }>("/api/questions", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return data.question;
  },
  async updateQuestion(id: number, input: QuestionInput): Promise<Question> {
    const data = await request<{ question: Question }>(`/api/questions/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return data.question;
  },
  async deleteQuestion(id: number): Promise<{ success: true }> {
    await request<void>(`/api/questions/${id}`, { method: "DELETE" });
    return { success: true };
  },
};
