import { MySqlQuestionRepository } from "./mysql-question-repository";
import type { QuestionRepository } from "./question-repository";

const globalForQuestionRepository = globalThis as typeof globalThis & {
  questionRepository?: QuestionRepository;
};

export function getQuestionRepository(): QuestionRepository {
  if (!globalForQuestionRepository.questionRepository) {
    globalForQuestionRepository.questionRepository = new MySqlQuestionRepository();
  }
  return globalForQuestionRepository.questionRepository;
}
