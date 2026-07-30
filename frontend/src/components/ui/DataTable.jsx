import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import EmptyState from "./EmptyState";
import Loading from "./Loading";

export default function DataTable({ columns, rows = [], loading = false, getRowId = (row) => row.id, onRowClick }) {
  if (loading) return <Loading variant="skeleton" />;
  if (!rows.length) return <EmptyState />;

  return (
    <TableContainer component={Box} sx={{ overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.key} align={column.align} sx={{ color: "text.secondary", fontSize: 12, fontWeight: 750, textTransform: "uppercase", letterSpacing: ".04em", whiteSpace: "nowrap" }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              hover
              key={getRowId(row)}
              onClick={() => onRowClick?.(row)}
              sx={{ cursor: onRowClick ? "pointer" : "default", "&:last-child td": { borderBottom: 0 } }}
            >
              {columns.map((column) => (
                <TableCell key={column.key} align={column.align}>
                  {column.render ? column.render(row) : row[column.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
