import Link from "next/link";
import { Box, Button, Paper, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import { useAppDispatch } from "@/store/hooks";
import { setTab } from "@/store/questionsSlice";

export function PageHero() {
  const dispatch = useAppDispatch();

  return (
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
            onClick={() => dispatch(setTab(1))}
          >
            View archived
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
