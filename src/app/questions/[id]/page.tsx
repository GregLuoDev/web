import { QuestionEditor } from "@/components/QuestionEditor";

export default async function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <QuestionEditor key={id} questionId={Number(id)} />;
}
