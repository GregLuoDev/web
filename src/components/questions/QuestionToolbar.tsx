import { MenuItem, Paper, TextField } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSearch, setSubject } from "@/store/questionsSlice";

const subjects = [
  "All",
  "Biology",
  "Calculus",
  "Web Development",
  "Arithmetic",
  "JavaScript",
];

export function QuestionToolbar() {
  const dispatch = useAppDispatch();
  const { search, subject } = useAppSelector((state) => state.questions);

  return (
    <Paper elevation={0} className="question-toolbar">
      <TextField
        value={search}
        onChange={(event) => dispatch(setSearch(event.target.value))}
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
        onChange={(event) => dispatch(setSubject(event.target.value))}
        className="subject-select"
      >
        {subjects.map((item) => (
          <MenuItem key={item} value={item}>
            {item}
          </MenuItem>
        ))}
      </TextField>
    </Paper>
  );
}
