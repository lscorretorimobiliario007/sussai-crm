import { MenuItem, TextField } from "@mui/material";

export default function Select({ options = [], fullWidth = true, ...props }) {
  return (
    <TextField select fullWidth={fullWidth} variant="outlined" {...props}>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
