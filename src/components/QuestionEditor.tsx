"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { z } from "zod";
import { api } from "@/api";
import type { QuestionInput } from "@/types/question";
import { ClipboardField } from "./ClipboardField";

const questionSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required."),
  content: z.string().trim().min(1, "Question content is required."),
  answerA: z.string().trim().min(1, "Answer A is required."),
  answerB: z.string().trim().min(1, "Answer B is required."),
  answerC: z.string().trim().min(1, "Answer C is required."),
  answerD: z.string().trim().min(1, "Answer D is required."),
  correctAnswer: z.enum(["A", "B", "C", "D"], { message: "Select A, B, C, or D." }),
});

interface QuestionEditorProps {
  questionId?: number;
}

const emptyInput: QuestionInput = {
  subject: "Biology",
  content: "Which organelle is responsible for ATP production?",
  answerA: "Nucleus",
  answerB: "Mitochondrion",
  answerC: "Ribosome",
  answerD: "Golgi apparatus",
  correctAnswer: "",
  note: "Includes image-based diagrams where needed",
};

export function QuestionEditor({ questionId }: QuestionEditorProps) {
  const router = useRouter();
  const [input, setInput] = useState<QuestionInput>(emptyInput);
  const [loading, setLoading] = useState(Boolean(questionId));
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    let active = true;
    void api.getQuestion(questionId)
      .then((question) => {
        if (!active) return;
        setInput({
          subject: question.subject,
          content: question.content,
          answerA: question.answerA,
          answerB: question.answerB,
          answerC: question.answerC,
          answerD: question.answerD,
          correctAnswer: question.correctAnswer,
          note: question.note,
        });
      })
      .catch((caught: unknown) => {
        if (active) setLoadError(caught instanceof Error ? caught.message : "We couldn't load this question.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [questionId]);

  const update = (field: keyof QuestionInput, value: string) => {
    setInput((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const save = async (draft = false) => {
    setSaveError(null);
    setFieldErrors({});
    if (!draft) {
      const result = questionSchema.safeParse(input);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (typeof field === "string") errors[field] = issue.message;
        });
        setFieldErrors(errors);
        setSaveError("Could not save question. Review the highlighted fields.");
        return;
      }
    }
    setSaving(true);
    try {
      if (questionId) await api.updateQuestion(questionId, input);
      else await api.createQuestion(input);
      router.push("/");
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "We couldn't save this question.");
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async () => {
    if (!questionId) return;
    try {
      await api.deleteQuestion(questionId);
      setDeleteOpen(false);
      router.push("/");
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "We couldn't delete this question.");
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={0} className="editor-loading state-card">
        <Typography variant="h5">Loading question</Typography>
        <Box className="loading-rows">
          <Skeleton height={50} />
          <Skeleton height={120} />
          <Skeleton height={50} />
        </Box>
      </Paper>
    );
  }

  if (loadError) {
    return (
      <Alert
        severity="error"
        action={<Button component={Link} href="/" color="inherit" size="small">Back to Questions</Button>}
        className="state-card"
      >
        <strong>Could not load question</strong>
        <Typography component="p" variant="body2">{loadError}</Typography>
      </Alert>
    );
  }

  return (
    <Box className="editor-page">
      <Box className="editor-heading">
        <Box>
          <Typography component="p" className="hero-eyebrow">Question details</Typography>
          <Typography component="h1">{questionId ? "Edit Question" : "Create Question"}</Typography>
          <Typography color="text.secondary">Add a question, four answers, and optional clipboard images</Typography>
        </Box>
        <Button component={Link} href="/" startIcon={<ArrowBackRoundedIcon />} variant="outlined">
          Back to Questions
        </Button>
      </Box>

      {saveError ? (
        <Alert severity="error" className="editor-alert">
          <strong>{saveError}</strong>
        </Alert>
      ) : null}

      <Paper elevation={0} className="editor-card">
        <Box className="editor-card__header">
          <Typography variant="h6">Question details</Typography>
          <Box component="span" className="subject-chip">{input.subject || "Uncategorized"}</Box>
        </Box>
        <Box className="editor-card__body">
          <Box className="editor-form-grid">
            <Box className="editor-field editor-field--full">
              <ClipboardField
                label="Question content"
                value={input.content}
                onChange={(value) => update("content", value)}
                multiline
                required
                error={Boolean(fieldErrors.content)}
                helperText={fieldErrors.content}
                minRows={4}
              />
            </Box>
            {(["A", "B", "C", "D"] as const).map((answer) => {
              const field = `answer${answer}` as "answerA" | "answerB" | "answerC" | "answerD";
              return (
                <Box className="editor-field" key={answer}>
                  <ClipboardField
                    label={`Answer ${answer}`}
                    value={input[field]}
                    onChange={(value) => update(field, value)}
                    multiline
                    required
                    error={Boolean(fieldErrors[field])}
                    helperText={fieldErrors[field]}
                    minRows={2}
                  />
                </Box>
              );
            })}
            <TextField
              select
              required
              label="Correct answer"
              value={input.correctAnswer}
              onChange={(event) => update("correctAnswer", event.target.value)}
              error={Boolean(fieldErrors.correctAnswer)}
              helperText={fieldErrors.correctAnswer || "Select A, B, C, or D."}
              className="editor-field"
            >
              {(["A", "B", "C", "D"] as const).map((answer) => (
                <MenuItem key={answer} value={answer}>Answer {answer}</MenuItem>
              ))}
            </TextField>
            <TextField
              required
              label="Subject"
              value={input.subject}
              onChange={(event) => update("subject", event.target.value)}
              error={Boolean(fieldErrors.subject)}
              helperText={fieldErrors.subject}
              className="editor-field"
            />
            <Box className="editor-field editor-field--full">
              <ClipboardField
                label="Note"
                value={input.note}
                onChange={(value) => update("note", value)}
                multiline
                minRows={3}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box className="editor-actions">
        {questionId ? (
          <Button color="error" variant="outlined" startIcon={<DeleteRoundedIcon />} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        ) : null}
        <Button variant="outlined" startIcon={<SaveRoundedIcon />} disabled={saving} onClick={() => void save(true)}>
          Save Draft
        </Button>
        <Button
          variant="contained"
          startIcon={questionId ? <CheckRoundedIcon /> : <AddRoundedIcon />}
          disabled={saving}
          onClick={() => void save(false)}
        >
          {saving ? "Saving…" : questionId ? "Save changes" : "Create Question"}
        </Button>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete question permanently?</DialogTitle>
        <DialogContent>
          <Typography>This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" startIcon={<DeleteRoundedIcon />} onClick={() => void deleteQuestion()}>
            Delete question permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
