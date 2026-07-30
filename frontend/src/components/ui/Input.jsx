import { TextField } from "@mui/material";

export default function Input({ fullWidth = true, ...props }) {
  return <TextField fullWidth={fullWidth} variant="outlined" {...props} />;
}
