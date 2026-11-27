import { questionIdSchema, questionInputSchema } from "@/lib/question-schemas";
import { AppError, errorResponse, readJsonBody } from "@/lib/errors";
import { validateEmbeddedImages } from "@/lib/image-validation";
import { getQuestionRepository } from "@/lib/question-services";

type RouteContext = { params: Promise<{ id: string }> };

function parseId(rawId: string): number {
  const parsed = questionIdSchema.safeParse(rawId);
  if (!parsed.success) throw new AppError(422, "VALIDATION_ERROR", "Question ID must be a positive integer.");
  return parsed.data;
}

export async function GET(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id: rawId } = await context.params;
    const question = await getQuestionRepository().getById(parseId(rawId));
    if (!question) throw new AppError(404, "NOT_FOUND", "Question not found.");
    return Response.json({ question });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id: rawId } = await context.params;
    const id = parseId(rawId);
    const body = await readJsonBody(request);
    const parsed = questionInputSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error);
    validateEmbeddedImages([
      parsed.data.content,
      parsed.data.answerA,
      parsed.data.answerB,
      parsed.data.answerC,
      parsed.data.answerD,
    ]);
    const question = await getQuestionRepository().update(id, parsed.data);
    if (!question) throw new AppError(404, "NOT_FOUND", "Question not found.");
    return Response.json({ question });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  try {
    const { id: rawId } = await context.params;
    const deleted = await getQuestionRepository().delete(parseId(rawId));
    if (!deleted) throw new AppError(404, "NOT_FOUND", "Question not found.");
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
