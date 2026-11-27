export type {
  CorrectAnswer,
  Question,
  QuestionInput as ApiQuestionInput,
  QuestionListResponse,
} from "@shared/types/question";

import type { CorrectAnswer as ValidAnswer } from "@shared/types/question";

export interface QuestionInput {
  subject: string;
  content: string;
  answerA: string;
  answerB: string;
  answerC: string;
  answerD: string;
  correctAnswer: ValidAnswer | "";
  note: string;
}
