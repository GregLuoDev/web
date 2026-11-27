"use client";

import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Paper, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSelectedQuestion } from "@/store/questionsSlice";

export function QuestionDetailsDialog() {
  const dispatch = useAppDispatch();
  const selectedQuestion = useAppSelector(
    (state) => state.questions.selectedQuestion,
  );

  const close = () => dispatch(setSelectedQuestion(null));

  return (
    <Dialog
      open={selectedQuestion !== null}
      onClose={close}
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
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              QUESTION
            </Typography>
            <QuestionValue value={selectedQuestion.content} />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
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
            <Button onClick={close}>Close</Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
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
