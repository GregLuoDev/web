import type { Question, QuestionInput, QuestionListResponse } from "@/types/question";

export interface ApiClient {
  listQuestions(search?: string, subject?: string, page?: number, pageSize?: number): Promise<QuestionListResponse>;
  getQuestion(id: number): Promise<Question>;
  createQuestion(input: QuestionInput): Promise<Question>;
  updateQuestion(id: number, input: QuestionInput): Promise<Question>;
  deleteQuestion(id: number): Promise<{ success: true }>;
}
