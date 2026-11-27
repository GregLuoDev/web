import { z } from "zod";

const fieldText = z.string().max(8_000_000);

export const questionInputSchema = z.object({
  subject: z.string().trim().min(1).max(120),
  content: fieldText,
  answerA: fieldText,
  answerB: fieldText,
  answerC: fieldText,
  answerD: fieldText,
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  note: z.string().max(100_000).default(""),
}).strict();

export const questionListQuerySchema = z.object({
  q: z.string().trim().max(500).optional().default(""),
  subject: z.string().trim().max(120).optional().default(""),
  page: z.coerce.number().int().min(1).max(100_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(25),
}).strict();

export const questionIdSchema = z.coerce.number().int().positive().max(2_147_483_647);

export type QuestionInput = z.infer<typeof questionInputSchema>;
export type QuestionListQuery = z.infer<typeof questionListQuerySchema>;
