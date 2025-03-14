import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { TableVirtuoso } from 'react-virtuoso';
import type { TableComponents } from 'react-virtuoso';

interface ColumnData {
  dataKey: string;
  label: string;
  numeric?: boolean;
  width?: number;
}

interface VirtualizedTableProps<T extends object> {
  data: T[];
  height?: number | string;
  width?: number | string;
  excludeKeys?: string[];
  columnConfig?: Record<string, Partial<ColumnData>>;
  defaultColumnWidth?: number;
}

const VirtuosoTableComponents: TableComponents<any> = {
  Scroller: React.forwardRef<HTMLDivElement>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props) => (
    <Table
      {...props}
      sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}
    />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableHead {...props} ref={ref} />
  )),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement>((props, ref) => (
    <TableBody {...props} ref={ref} />
  )),
};

// Helper function to derive columns from data
function deriveColumns<T extends object>(
  data: T[],
  excludeKeys: string[],
  columnConfig: Record<string, Partial<ColumnData>>,
  defaultColumnWidth: number
): ColumnData[] {
  if (!data || data.length === 0) return [];

  const firstItem = data[0];
  const keys = Object.keys(firstItem).filter(
    (key) => !excludeKeys.includes(key)
  );

  return keys.map((key) => {
    const config = columnConfig[key] || {};
    const value = firstItem[key as keyof typeof firstItem];
    const isNumeric = typeof value === 'number';

    return {
      dataKey: key,
      label: config.label || key.charAt(0).toUpperCase() + key.slice(1),
      numeric: config.numeric !== undefined ? config.numeric : isNumeric,
      width: config.width || defaultColumnWidth,
    };
  });
}

function DynamicVirtualizedTable<T extends object>({
  data,
  height = 400,
  width = '100%',
  excludeKeys = [],
  columnConfig = {},
  defaultColumnWidth = 100,
}: VirtualizedTableProps<T>) {
  // Derive columns only once during initial render or when inputs change
  const columns = React.useMemo(
    () => deriveColumns(data, excludeKeys, columnConfig, defaultColumnWidth),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      data.length > 0 ? data[0] : null, // Only depend on the first item's structure
      excludeKeys.join(','), // Convert arrays to strings for comparison
      JSON.stringify(columnConfig), // Convert objects to strings for comparison
      defaultColumnWidth,
    ]
  );

  const fixedHeaderContent = React.useCallback(() => {
    return (
      <TableRow>
        {columns.map((column) => (
          <TableCell
            key={column.dataKey}
            variant="head"
            align={column.numeric || false ? 'right' : 'left'}
            style={{ width: column.width }}
            sx={{ backgroundColor: 'background.paper' }}
            className="font-bold uppercase"
          >
            {column.label}
          </TableCell>
        ))}
      </TableRow>
    );
  }, [columns]);

  const rowContent = React.useCallback(
    (_index: number, row: T) => {
      return (
        <React.Fragment>
          {columns.map((column) => {
            const cellValue = row[column.dataKey as keyof typeof row];
            return (
              <TableCell
                key={column.dataKey}
                align={column.numeric || false ? 'right' : 'left'}
              >
                {cellValue !== undefined ? String(cellValue) : ''}
              </TableCell>
            );
          })}
        </React.Fragment>
      );
    },
    [columns]
  );

  if (!data || data.length === 0 || columns.length === 0) {
    return (
      <Paper
        style={{
          height,
          width,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        No data available
      </Paper>
    );
  }

  return (
    <Paper style={{ height, width }}>
      <TableVirtuoso
        data={data}
        components={VirtuosoTableComponents}
        fixedHeaderContent={fixedHeaderContent}
        itemContent={rowContent}
      />
    </Paper>
  );
}

export default DynamicVirtualizedTable;
