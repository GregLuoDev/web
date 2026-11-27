"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Box, Button, Chip, Paper } from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteQuestionById,
  fetchQuestions,
  setSelectedQuestion,
} from "@/store/questionsSlice";
import type { Question } from "@/types/question";

export function QuestionGrid() {
  const dispatch = useAppDispatch();
  const { items, search, subject } = useAppSelector(
    (state) => state.questions,
  );

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
                onClick={() => {
                  if (!window.confirm("Delete this question permanently?"))
                    return;
                  void dispatch(deleteQuestionById(question.id)).then(
                    (result) => {
                      if (deleteQuestionById.fulfilled.match(result)) {
                        dispatch(fetchQuestions({ search, subject }));
                      }
                    },
                  );
                }}
              >
                Delete
              </Button>
            </Box>
          );
        },
      },
    ],
    [dispatch, search, subject],
  );

  return (
    <Paper elevation={0} className="ag-grid-card">
      <div className="ag-theme-quartz question-grid">
        <AgGridReact<Question>
          theme="legacy"
          rowData={items}
          columnDefs={columns}
          pagination
          paginationPageSize={10}
          defaultColDef={{ resizable: true, filter: true }}
          rowHeight={52}
          headerHeight={44}
          getRowId={(params) => String(params.data.id)}
          onRowDoubleClicked={(event) => {
            if (event.data) dispatch(setSelectedQuestion(event.data));
          }}
        />
      </div>
    </Paper>
  );
}
