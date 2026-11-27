import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuestions, setTab } from "@/store/questionsSlice";
import { QuestionGrid } from "./QuestionGrid";

export function QuestionResults() {
  const dispatch = useAppDispatch();
  const { error, items, search, status, subject, tab } = useAppSelector(
    (state) => state.questions,
  );

  if (status === "loading") {
    return (
      <Paper elevation={0} className="state-card">
        <Typography variant="h6">Loading questions</Typography>
        <Box className="loading-rows">
          {[92, 78, 68, 84].map((width) => (
            <Skeleton
              key={width}
              variant="text"
              width={`${width}%`}
              height={38}
            />
          ))}
        </Box>
      </Paper>
    );
  }

  if (status === "failed") {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => {
              void dispatch(fetchQuestions({ search, subject }));
            }}
          >
            Try again
          </Button>
        }
        className="state-card"
      >
        <strong>Could not load questions</strong>
        <Typography component="p" variant="body2">
          {error}
        </Typography>
      </Alert>
    );
  }

  if (tab === 1) {
    return (
      <Paper elevation={0} className="empty-state">
        <ArchiveRoundedIcon className="empty-state__icon" />
        <Typography variant="h6">No archived questions</Typography>
        <Typography color="text.secondary">
          Archived questions will appear here.
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshRoundedIcon />}
          onClick={() => dispatch(setTab(0))}
        >
          Return to active questions
        </Button>
      </Paper>
    );
  }

  if (items.length === 0) {
    return (
      <Paper elevation={0} className="empty-state">
        <SearchRoundedIcon className="empty-state__icon" />
        <Typography variant="h6">No questions found</Typography>
        <Typography color="text.secondary">
          Try another search or create a new question.
        </Typography>
        <Button
          component={Link}
          href="/questions/new"
          variant="contained"
          startIcon={<AddRoundedIcon />}
        >
          Create Question
        </Button>
      </Paper>
    );
  }

  return <QuestionGrid />;
}
