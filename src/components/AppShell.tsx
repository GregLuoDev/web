"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  CssBaseline,
  IconButton,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import ListAltRoundedIcon from "@mui/icons-material/ListAltRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import type { PreviewDataState } from "@/api/previewState";
import { api } from "@/api";

interface AppShellProps {
  children: React.ReactNode;
}

function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener("app-theme-change", onChange);
  return () => window.removeEventListener("app-theme-change", onChange);
}

function getThemeSnapshot(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem("app-theme") === "dark" ? "dark" : "light";
}

export function AppShell({ children }: AppShellProps) {
  const mode = useSyncExternalStore<"light" | "dark">(
    subscribeToTheme,
    getThemeSnapshot,
    () => "light",
  );
  const pathname = usePathname() ?? "/";
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void api.listQuestions("", "All", 1, 1)
      .then((response) => {
        if (active) setQuestionCount(response.total);
      })
      .catch(() => {
        if (active) setQuestionCount(null);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#1976D2" },
          secondary: { main: "#9C27B0" },
          background: mode === "dark"
            ? { default: "#111827", paper: "#1F2937" }
            : { default: "#F8FAFC", paper: "#FFFFFF" },
          text: mode === "dark"
            ? { primary: "#F9FAFB", secondary: "#CBD5E1" }
            : { primary: "#1F2937", secondary: "#6B7280" },
          divider: mode === "dark" ? "#374151" : "#D0D5DD",
        },
        typography: {
          fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
        },
        shape: { borderRadius: 8 },
        components: {
          MuiButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 700 } } },
          MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
        },
      }),
    [mode],
  );

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    window.localStorage.setItem("app-theme", next);
    window.dispatchEvent(new Event("app-theme-change"));
  };

  const setPreviewState = (state: PreviewDataState) => {
    window.localStorage.setItem("previewState", state);
    const url = new URL(window.location.href);
    url.searchParams.set("previewState", state);
    window.location.assign(url.toString());
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
        <AppBar position="sticky" elevation={0} color="inherit" className="app-header">
          <Toolbar className="app-header__toolbar">
            <Box className="app-brand">
              <Box className="app-logo" aria-hidden="true"><QuizRoundedIcon fontSize="small" /></Box>
              <Typography>Exam Question Bank</Typography>
            </Box>
            <Box className="app-header-actions">
              <Box component="span" className="question-count">
                {questionCount === null ? "MySQL unavailable" : `${questionCount.toLocaleString()} questions`}
              </Box>
              <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}>
                <IconButton onClick={toggleTheme} aria-label="Toggle color theme" size="small">
                  {mode === "light" ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>
        <nav className="app-nav" aria-label="Primary navigation">
          <Link href="/" className={`app-nav__link ${pathname === "/" ? "app-nav__link--active" : ""}`}>
            <ListAltRoundedIcon fontSize="small" />
            Questions
          </Link>
          <Link href="/questions/new" className={`app-nav__link ${pathname.startsWith("/questions") ? "app-nav__link--active" : ""}`}>
            <EditNoteRoundedIcon fontSize="small" />
            New Question
          </Link>
        </nav>
        <main className="app-main">{children}</main>

        {process.env.NODE_ENV === "development" ? (
          <Box component="aside" className="preview-switcher" aria-label="Mock data state">
            <Typography component="span" className="preview-switcher__label">Preview state</Typography>
            {(["data", "loading", "empty", "error"] as const).map((state) => (
              <Button key={state} size="small" variant="text" onClick={() => setPreviewState(state)}>
                {state}
              </Button>
            ))}
          </Box>
        ) : null}
      </Box>
    </ThemeProvider>
  );
}
