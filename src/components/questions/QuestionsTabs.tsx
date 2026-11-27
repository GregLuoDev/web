import { Tab, Tabs } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTab } from "@/store/questionsSlice";

export function QuestionsTabs() {
  const dispatch = useAppDispatch();
  const tab = useAppSelector((state) => state.questions.tab);

  return (
    <Tabs
      value={tab}
      onChange={(_, value: number) => dispatch(setTab(value))}
      className="question-tabs"
    >
      <Tab label="Active questions" />
      <Tab label="Archived" />
    </Tabs>
  );
}
