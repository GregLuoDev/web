"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Paper,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { api } from "@/api";
import type { Question } from "@/types/question";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [tab, setTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    void api
      .listQuestions(search, subject)
      .then((response) => {
        if (!active) return;
        setQuestions(response.items);
        setError(null);
      })
      .catch((caught: unknown) => {
        if (active)
          setError(
            caught instanceof Error
              ? caught.message
              : "We couldn't load the question bank.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, subject, refreshKey]);

  const deleteQuestion = useCallback(async (id: number) => {
    if (!window.confirm("Delete this question permanently?")) return;
    try {
      await api.deleteQuestion(id);
      setLoading(true);

      setRefreshKey((current) => current + 1);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't delete this question.",
      );
    }
  }, []);

  const columns = useMemo<ColDef<Question>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, sortable: true },
      {
        field: "content",
        headerName: "Question",
        flex: 1.8,
        minWidth: 260,
        sortable: true,
      },
      {
        field: "correctAnswer",
        headerName: "Correct Answer",
        width: 190,
        cellRenderer: (params: ICellRendererParams<Question>) => {
          const question = params.data;
          if (!question) return null;
          const answerKey = `answer${question.correctAnswer}` as
            | "answerA"
            | "answerB"
            | "answerC"
            | "answerD";
          return (
            <Chip
              size="small"
              label={`${question.correctAnswer}: ${question[answerKey]}`}
              className="answer-chip"
            />
          );
        },
      },
      { field: "subject", headerName: "Subject", width: 170, sortable: true },
      { field: "updateAt", headerName: "Updated", width: 180, sortable: true },
      {
        headerName: "",
        width: 150,
        sortable: false,
        filter: false,
        cellRenderer: (params: ICellRendererParams<Question>) => {
          const question = params.data;
          if (!question) return null;
          return (
            <Box className="table-actions">
              <Button
                component={Link}
                href={`/questions/${question.id}`}
                size="small"
                startIcon={<EditRoundedIcon />}
              >
                Edit
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => void deleteQuestion(question.id)}
              >
                Delete
              </Button>
            </Box>
          );
        },
      },
    ],
    [deleteQuestion],
  );

  return (
    <Box className="questions-page">
      <Paper elevation={0} className="page-hero">
        <Box className="hero-mesh" aria-hidden="true" />
        <Box className="page-hero__content">
          <Typography component="p" className="hero-eyebrow">
            Exam library
          </Typography>
          <Typography variant="h1" className="hero-title">
            Questions
          </Typography>
          <Typography component="p" className="hero-subtitle">
            Search, review, and maintain your exam question bank.
          </Typography>
          <Box className="hero-actions">
            <Button
              component={Link}
              href="/questions/new"
              variant="contained"
              startIcon={<AddRoundedIcon />}
            >
              Create Question
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ArchiveRoundedIcon />}
              onClick={() => setTab(1)}
            >
              View archived questions234
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} className="question-toolbar">
        <TextField
          value={search}
          onChange={(event) => {
            setLoading(true);
            setSearch(event.target.value);
          }}
          size="small"
          placeholder="Search questions"
          className="question-search"
          slotProps={{
            input: { startAdornment: <SearchRoundedIcon fontSize="small" /> },
          }}
        />
        <TextField
          select
          size="small"
          label="Subject"
          value={subject}
          onChange={(event) => {
            setLoading(true);
            setSubject(event.target.value);
          }}
          className="subject-select"
        >
          {[
            "All",
            "Biology",
            "Calculus",
            "Web Development",
            "Arithmetic",
            "JavaScript",
          ].map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        className="question-tabs"
      >
        <Tab label="Active questions" />
        <Tab label="Archived" />
      </Tabs>

      {loading ? (
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
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                setLoading(true);
                setRefreshKey((current) => current + 1);
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
      ) : tab === 1 ? (
        <Paper elevation={0} className="empty-state">
          <ArchiveRoundedIcon className="empty-state__icon" />
          <Typography variant="h6">No archived questions</Typography>
          <Typography color="text.secondary">
            Archived questions will appear here.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshRoundedIcon />}
            onClick={() => setTab(0)}
          >
            Return to active questions
          </Button>
        </Paper>
      ) : questions.length === 0 ? (
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
      ) : (
        <Paper elevation={0} className="ag-grid-card">
          <div className="ag-theme-quartz question-grid">
            <AgGridReact<Question>
              theme="legacy"
              rowData={questions}
              columnDefs={columns}
              pagination
              paginationPageSize={10}
              defaultColDef={{ resizable: true, filter: true }}
              rowHeight={52}
              headerHeight={44}
              getRowId={(params) => String(params.data.id)}
              onRowDoubleClicked={(event) => {
                if (event.data) setSelectedQuestion(event.data);
              }}
            />
          </div>
        </Paper>
      )}
      <Dialog
        open={selectedQuestion !== null}
        onClose={() => setSelectedQuestion(null)}
        fullWidth
        maxWidth="md"
        aria-labelledby="question-details-title"
      >
        {selectedQuestion ? (
          <>
            <DialogTitle id="question-details-title">
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <span>Question #{selectedQuestion.id}</span>
                <Chip
                  label={selectedQuestion.subject}
                  size="small"
                  color="secondary"
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                QUESTION
              </Typography>
              <QuestionValue value={selectedQuestion.content} />
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                ANSWERS
              </Typography>
              <Box sx={{ display: "grid", gap: 1 }}>
                {(["A", "B", "C", "D"] as const).map((answer) => {
                  const value = selectedQuestion[`answer${answer}`];
                  const correct = selectedQuestion.correctAnswer === answer;
                  return (
                    <Paper
                      key={answer}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        borderColor: correct ? "success.main" : "divider",
                        bgcolor: correct ? "success.50" : "background.paper",
                      }}
                    >
                      <Chip
                        label={answer}
                        size="small"
                        color={correct ? "success" : "default"}
                      />
                      <QuestionValue value={value} />
                      {correct ? (
                        <Chip
                          label="Correct answer"
                          size="small"
                          color="success"
                        />
                      ) : null}
                    </Paper>
                  );
                })}
              </Box>
              {selectedQuestion.note ? (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    NOTE
                  </Typography>
                  <QuestionValue value={selectedQuestion.note} />
                </>
              ) : null}
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Updated {selectedQuestion.updateAt}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedQuestion(null)}>Close</Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
}

function QuestionValue({ value }: { value: string }) {
  const imagePattern = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = imagePattern.exec(value)) !== null) {
    if (match.index > cursor) parts.push(value.slice(cursor, match.index));
    parts.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${match.index}-${match[2].slice(0, 30)}`}
        src={match[2]}
        alt={match[1] || "Pasted question image"}
        style={{
          display: "block",
          maxWidth: "100%",
          maxHeight: 320,
          objectFit: "contain",
          marginBlock: 8,
        }}
      />,
    );
    cursor = imagePattern.lastIndex;
  }
  if (cursor < value.length || parts.length === 0)
    parts.push(value.slice(cursor));

  return (
    <Box sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", minWidth: 0 }}>
      {parts}
    </Box>
  );
}
