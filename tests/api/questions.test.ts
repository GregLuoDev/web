// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  healthCheck: vi.fn(),
}));

vi.mock("@/lib/question-services", () => ({
  getQuestionRepository: () => repository,
}));

import { GET as listQuestions, POST as createQuestion } from "@/app/api/questions/route";
import {
  DELETE as deleteQuestion,
  GET as getQuestion,
  PUT as updateQuestion,
} from "@/app/api/questions/[id]/route";
import { GET as health } from "@/app/api/health/route";
import type { Question } from "@shared/types/question";

const question: Question = {
  id: 1042,
  subject: "Biology",
  content: "Which organelle produces ATP?",
  answerA: "Nucleus",
  answerB: "Mitochondrion",
  answerC: "Ribosome",
  answerD: "Golgi apparatus",
  correctAnswer: "B",
  updateAt: "2026-11-27 09:42",
  note: "",
};

const input = {
  subject: question.subject,
  content: question.content,
  answerA: question.answerA,
  answerB: question.answerB,
  answerC: question.answerC,
  answerD: question.answerD,
  correctAnswer: question.correctAnswer,
  note: question.note,
};

function request(path: string, method = "GET", body?: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("question API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("lists questions with parsed filters and pagination", async () => {
    repository.list.mockResolvedValue({ items: [question], total: 1, page: 2, pageSize: 10 });
    const response = await listQuestions(request("/api/questions?q=ATP&subject=Biology&page=2&pageSize=10"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [question], total: 1, page: 2, pageSize: 10 });
    expect(repository.list).toHaveBeenCalledWith({ search: "ATP", subject: "Biology", page: 2, pageSize: 10 });
  });

  it("rejects invalid pagination with a standardized validation error", async () => {
    const response = await listQuestions(request("/api/questions?page=0"));

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", message: "Request validation failed." },
    });
    expect(repository.list).not.toHaveBeenCalled();
  });

  it("creates a question and accepts embedded clipboard image data", async () => {
    const created = { ...input, content: "Question ![Pasted image](data:image/png;base64,aGVsbG8=)" };
    const saved = { ...question, content: created.content };
    repository.create.mockResolvedValue(saved);
    const response = await createQuestion(request("/api/questions", "POST", created));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ question: saved });
    expect(repository.create).toHaveBeenCalledWith(created);
  });

  it("rejects malformed image data before persistence", async () => {
    const response = await createQuestion(
      request("/api/questions", "POST", { ...input, answerA: "![image](data:image/svg+xml;base64,PHN2Zz4=)" }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      error: { code: "VALIDATION_ERROR", message: "Pasted images must be PNG, JPEG, GIF, or WebP data URLs." },
    });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await createQuestion(new Request("http://localhost/api/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
  });

  it("gets, updates, and deletes a question by id", async () => {
    repository.getById.mockResolvedValue(question);
    repository.update.mockResolvedValue({ ...question, subject: "Biology II" });
    repository.delete.mockResolvedValue(true);

    const getResponse = await getQuestion(request("/api/questions/1042"), routeContext("1042"));
    const putResponse = await updateQuestion(request("/api/questions/1042", "PUT", input), routeContext("1042"));
    const deleteResponse = await deleteQuestion(request("/api/questions/1042", "DELETE"), routeContext("1042"));

    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual({ question });
    expect(putResponse.status).toBe(200);
    expect(await putResponse.json()).toMatchObject({ question: { subject: "Biology II" } });
    expect(deleteResponse.status).toBe(204);
  });

  it("returns not-found for missing records and malformed IDs", async () => {
    repository.getById.mockResolvedValue(null);
    const missing = await getQuestion(request("/api/questions/42"), routeContext("42"));
    const invalid = await getQuestion(request("/api/questions/0"), routeContext("0"));

    expect(missing.status).toBe(404);
    expect(await missing.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });
  });

  it("reports database health as healthy or unavailable", async () => {
    repository.healthCheck.mockResolvedValue(undefined);
    const healthy = await health();
    repository.healthCheck.mockRejectedValue(new Error("offline"));
    const unavailable = await health();

    expect(healthy.status).toBe(200);
    expect(await healthy.json()).toEqual({ status: "healthy", services: { mysql: "healthy" } });
    expect(unavailable.status).toBe(503);
    expect(await unavailable.json()).toEqual({ status: "unhealthy", services: { mysql: "unhealthy" } });
  });
});
