import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/api";
import type { Question } from "@/types/question";

interface FetchQuestionsArgs {
  search: string;
  subject: string;
}

interface QuestionsState {
  items: Question[];
  search: string;
  subject: string;
  tab: number;
  selectedQuestion: Question | null;
  status: "loading" | "succeeded" | "failed";
  error: string | null;
  currentRequestId?: string;
}

const initialState: QuestionsState = {
  items: [],
  search: "",
  subject: "All",
  tab: 0,
  selectedQuestion: null,
  status: "loading",
  error: null,
};

export const fetchQuestions = createAsyncThunk<
  Question[],
  FetchQuestionsArgs,
  { rejectValue: string }
>(
  "questions/fetchQuestions",
  async ({ search, subject }: FetchQuestionsArgs, { rejectWithValue }) => {
    try {
      const response = await api.listQuestions(search, subject);
      return response.items;
    } catch (caught) {
      return rejectWithValue(
        caught instanceof Error
          ? caught.message
          : "We couldn't load the question bank.",
      );
    }
  },
);

export const deleteQuestionById = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>(
  "questions/deleteQuestion",
  async (id: number, { rejectWithValue }) => {
    try {
      await api.deleteQuestion(id);
      return id;
    } catch (caught) {
      return rejectWithValue(
        caught instanceof Error
          ? caught.message
          : "We couldn't delete this question.",
      );
    }
  },
);

const questionsSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    setSearch(state, action: { payload: string }) {
      state.search = action.payload;
      state.status = "loading";
    },
    setSubject(state, action: { payload: string }) {
      state.subject = action.payload;
      state.status = "loading";
    },
    setTab(state, action: { payload: number }) {
      state.tab = action.payload;
    },
    setSelectedQuestion(state, action: { payload: Question | null }) {
      state.selectedQuestion = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.items = action.payload;
        state.status = "succeeded";
        state.error = null;
        state.currentRequestId = undefined;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;
        state.status = "failed";
        state.error =
          action.payload ??
          "We couldn't load the question bank.";
        state.currentRequestId = undefined;
      })
      .addCase(deleteQuestionById.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (question) => question.id !== action.payload,
        );
      })
      .addCase(deleteQuestionById.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.status = "failed";
        state.error =
          action.payload ??
          "We couldn't delete this question.";
      });
  },
});

export const {
  setSearch,
  setSubject,
  setTab,
  setSelectedQuestion,
} = questionsSlice.actions;

export default questionsSlice.reducer;
