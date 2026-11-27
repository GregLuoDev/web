import type { ApiClient } from "./types";
import type { Question, QuestionInput } from "@/types/question";
import { getPreviewDataState } from "./previewState";

const sampleQuestions: Question[] = [
  {
    id: 1042,
    content: "Which organelle is responsible for ATP production?",
    answerA: "Nucleus",
    answerB: "Mitochondrion",
    answerC: "Ribosome",
    answerD: "Golgi apparatus",
    correctAnswer: "B",
    subject: "Biology",
    updateAt: "2026-11-27 09:42",
    note: "Includes image-based diagrams where needed",
  },
  {
    id: 1041,
    content: "What is the derivative of sin(x)?",
    answerA: "-sin(x)",
    answerB: "-cos(x)",
    answerC: "cos(x)",
    answerD: "tan(x)",
    correctAnswer: "C",
    subject: "Calculus",
    updateAt: "2026-11-26 16:18",
    note: "",
  },
  {
    id: 1039,
    content: "Which HTML element defines a web page paragraph?",
    answerA: "<div>",
    answerB: "<section>",
    answerC: "<article>",
    answerD: "<p>",
    correctAnswer: "D",
    subject: "Web Development",
    updateAt: "2026-11-26 11:05",
    note: "",
  },
  {
    id: 1037,
    content: "Solve: 12 + 8 × 3",
    answerA: "36",
    answerB: "60",
    answerC: "24",
    answerD: "44",
    correctAnswer: "A",
    subject: "Arithmetic",
    updateAt: "2026-11-25 14:30",
    note: "",
  },
  {
    id: 1034,
    content: "Which keyword declares a constant in JavaScript?",
    answerA: "let",
    answerB: "const",
    answerC: "var",
    answerD: "static",
    correctAnswer: "B",
    subject: "JavaScript",
    updateAt: "2026-11-24 10:12",
    note: "",
  },
];

let questions = sampleQuestions.map((question) => ({ ...question }));

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

async function guard<T>(data: T): Promise<T> {
  await delay();
  const state = getPreviewDataState();
  if (state === "loading") await new Promise<void>(() => undefined);
  if (state === "error") throw new Error("We couldn't load the question bank.");
  if (state === "empty") {
    if (Array.isArray(data)) return [] as T;
  }
  return data;
}

function normalizeInput(input: QuestionInput): Omit<Question, "id" | "updateAt"> {
  if (!input.correctAnswer) throw new Error("A correct answer is required.");
  return {
    subject: input.subject,
    content: input.content,
    answerA: input.answerA,
    answerB: input.answerB,
    answerC: input.answerC,
    answerD: input.answerD,
    correctAnswer: input.correctAnswer,
    note: input.note,
  };
}

export const mockClient: ApiClient = {
  async listQuestions(search, subject, page = 1, pageSize = 20) {
    const normalizedSearch = search?.trim().toLowerCase() ?? "";
    let items = questions.filter((question) => {
      const matchesSubject = !subject || subject === "All" || question.subject === subject;
      const matchesSearch =
        !normalizedSearch ||
        question.content.toLowerCase().includes(normalizedSearch) ||
        question.subject.toLowerCase().includes(normalizedSearch);
      return matchesSubject && matchesSearch;
    });
    const total = items.length;
    const start = (page - 1) * pageSize;
    items = items.slice(start, start + pageSize);
    return guard({ items, total, page, pageSize });
  },
  async getQuestion(id) {
    await delay();
    const state = getPreviewDataState();
    if (state === "loading") await new Promise<void>(() => undefined);
    if (state === "error") throw new Error("We couldn't load this question.");
    const question = questions.find((item) => item.id === id);
    if (!question) throw new Error("Question not found.");
    return guard(question);
  },
  async createQuestion(input) {
    await delay();
    const values = normalizeInput(input);
    const question: Question = {
      id: Math.max(1042, ...questions.map((item) => item.id)) + 1,
      ...values,
      updateAt: "2026-11-27 22:36",
    };
    questions = [question, ...questions];
    return guard(question);
  },
  async updateQuestion(id, input) {
    await delay();
    const values = normalizeInput(input);
    const index = questions.findIndex((item) => item.id === id);
    if (index < 0) throw new Error("Question not found.");
    const question: Question = { ...questions[index], ...values, updateAt: "2026-11-27 22:36" };
    questions = questions.map((item) => (item.id === id ? question : item));
    return guard(question);
  },
  async deleteQuestion(id) {
    await delay();
    questions = questions.filter((item) => item.id !== id);
    return guard({ success: true });
  },
};
