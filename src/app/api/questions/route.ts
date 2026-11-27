import { questionInputSchema, questionListQuerySchema } from "@/lib/question-schemas";
import { errorResponse, readJsonBody } from "@/lib/errors";
import { validateEmbeddedImages } from "@/lib/image-validation";
import { getQuestionRepository } from "@/lib/question-services";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const parsed = questionListQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      subject: url.searchParams.get("subject") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) return errorResponse(parsed.error);
    const result = await getQuestionRepository().list({
      search: parsed.data.q,
      subject: parsed.data.subject,
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
    });
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
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
    const question = await getQuestionRepository().create(parsed.data);
    return Response.json({ question }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
