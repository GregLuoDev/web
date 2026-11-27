import { describe, expect, it } from "vitest";
import { mockClient } from "@/api/mockClient";

describe("mock question client", () => {
  it("preserves the exact sample question rows", async () => {
    const response = await mockClient.listQuestions();

    expect(response.items.map((question) => question.id)).toEqual([1042, 1041, 1039, 1037, 1034]);
    expect(response.items[0]).toMatchObject({
      content: "Which organelle is responsible for ATP production?",
      answerB: "Mitochondrion",
      correctAnswer: "B",
      subject: "Biology",
      updateAt: "2026-11-27 09:42",
    });
  });

  it("returns a question by id", async () => {
    const question = await mockClient.getQuestion(1039);
    expect(question.subject).toBe("Web Development");
  });
});
