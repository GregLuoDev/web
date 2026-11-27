"use client";

import { useEffect } from "react";
import { Box } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuestions } from "@/store/questionsSlice";
import { PageHero } from "@/components/questions/PageHero";
import { QuestionDetailsDialog } from "@/components/questions/QuestionDetailsDialog";
import { QuestionResults } from "@/components/questions/QuestionResults";
import { QuestionsTabs } from "@/components/questions/QuestionsTabs";
import { QuestionToolbar } from "@/components/questions/QuestionToolbar";

export default function QuestionsPage() {
  const dispatch = useAppDispatch();
  const { search, subject } = useAppSelector((state) => state.questions);

  useEffect(() => {
    void dispatch(fetchQuestions({ search, subject }));
  }, [dispatch, search, subject]);

  return (
    <Box className="questions-page">
      <PageHero />
      <QuestionToolbar />
      <QuestionsTabs />
      <QuestionResults />
      <QuestionDetailsDialog />
    </Box>
  );
}
