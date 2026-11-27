import type { Question, QuestionInput, QuestionListResponse } from "@shared/types/question";

export interface QuestionFilters {
  search: string;
  subject: string;
  page: number;
  pageSize: number;
}

export interface QuestionRepository {
  list(filters: QuestionFilters): Promise<QuestionListResponse>;
  getById(id: number): Promise<Question | null>;
  create(input: QuestionInput): Promise<Question>;
  update(id: number, input: QuestionInput): Promise<Question | null>;
  delete(id: number): Promise<boolean>;
  healthCheck(): Promise<void>;
}
