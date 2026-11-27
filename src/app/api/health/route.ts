import { getQuestionRepository } from "@/lib/question-services";

export async function GET(): Promise<Response> {
  try {
    await getQuestionRepository().healthCheck();
    return Response.json({ status: "healthy", services: { mysql: "healthy" } });
  } catch {
    return Response.json(
      { status: "unhealthy", services: { mysql: "unhealthy" } },
      { status: 503 },
    );
  }
}
