import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit2, Check, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/pages/Index";

interface DataVisualizationProps {
  data: any[];
  columns: string[];
  viewMode: ViewMode;
  onDataUpdate: (data: any[]) => void;
}

interface EditingCell {
  rowIndex: number;
  column: string;
  value: string;
}

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#ff00ff",
];

export default function DataVisualization({
  data,
  columns,
  viewMode,
  onDataUpdate,
}: DataVisualizationProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const handleCellEdit = async (
    rowIndex: number,
    column: string,
    newValue: string,
  ) => {
    try {
      const response = await fetch("/api/update-row", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rowIndex,
          column,
          value: newValue,
          originalData: data[rowIndex],
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed");
      }

      const updatedData = [...data];
      updatedData[rowIndex][column] = newValue;
      onDataUpdate(updatedData);

      toast.success("Cell updated successfully");
    } catch (error) {
      toast.error("Failed to update cell");
      console.error("Update error:", error);
    }
  };

  const startEditing = (
    rowIndex: number,
    column: string,
    currentValue: any,
  ) => {
    setEditingCell({
      rowIndex,
      column,
      value: String(currentValue || ""),
    });
  };

  const saveEdit = () => {
    if (editingCell) {
      handleCellEdit(
        editingCell.rowIndex,
        editingCell.column,
        editingCell.value,
      );
      setEditingCell(null);
    }
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  const renderTableView = () => (
    <Card>
      <CardHeader>
        <CardTitle>Table View</CardTitle>
        <CardDescription>Click any cell to edit inline</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="whitespace-nowrap">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell
                      key={column}
                      className="group relative cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        startEditing(rowIndex, column, row[column])
                      }
                    >
                      {editingCell?.rowIndex === rowIndex &&
                      editingCell?.column === column ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingCell.value}
                            onChange={(e) =>
                              setEditingCell({
                                ...editingCell,
                                value: e.target.value,
                              })
                            }
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") cancelEdit();
                            }}
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="truncate max-w-[200px]">
                            {String(row[column] || "")}
                          </span>
                          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const renderCardsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((row, rowIndex) => (
        <Card key={rowIndex} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Record {rowIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {columns.slice(0, 6).map((column) => (
              <div key={column} className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  {column}
                </label>
                {editingCell?.rowIndex === rowIndex &&
                editingCell?.column === column ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingCell.value}
                      onChange={(e) =>
                        setEditingCell({
                          ...editingCell,
                          value: e.target.value,
                        })
                      }
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button size="sm" variant="ghost" onClick={saveEdit}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="group cursor-pointer p-2 rounded border hover:bg-muted/50 transition-colors"
                    onClick={() => startEditing(rowIndex, column, row[column])}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">
                        {String(row[column] || "—")}
                      </span>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )}
              </div>
            ))}
            {columns.length > 6 && (
              <Badge variant="secondary" className="text-xs">
                +{columns.length - 6} more fields
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderDashboardView = () => {
    // Create sample charts from data
    const numericColumns = columns.filter((col) =>
      data.some((row) => !isNaN(Number(row[col])) && row[col] !== ""),
    );

    const categoryColumns = columns.filter(
      (col) => !numericColumns.includes(col),
    );

    // Bar chart data
    const barData = numericColumns.slice(0, 5).map((col) => ({
      name: col,
      value:
        data.reduce((sum, row) => sum + (Number(row[col]) || 0), 0) /
        data.length,
    }));

    // Pie chart data (first categorical column)
    const pieData = categoryColumns[0]
      ? Object.entries(
          data.reduce(
            (acc, row) => {
              const key = String(row[categoryColumns[0]] || "Unknown");
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        )
          .slice(0, 6)
          .map(([name, value]) => ({ name, value }))
      : [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.length}</div>
              <p className="text-xs text-muted-foreground">
                Across {columns.length} columns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Numeric Fields
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{numericColumns.length}</div>
              <p className="text-xs text-muted-foreground">
                Available for calculations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryColumns.length}</div>
              <p className="text-xs text-muted-foreground">Text-based fields</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          {barData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Average Values
                </CardTitle>
                <CardDescription>Numeric columns overview</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Distribution
                </CardTitle>
                <CardDescription>
                  {categoryColumns[0]} breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Data preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Data Preview</CardTitle>
            <CardDescription>First 5 records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.slice(0, 6).map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.slice(0, 6).map((column) => (
                        <TableCell
                          key={column}
                          className="max-w-[150px] truncate"
                        >
                          {String(row[column] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in-50 duration-500">
      {viewMode === "table" && renderTableView()}
      {viewMode === "cards" && renderCardsView()}
      {viewMode === "dashboard" && renderDashboardView()}
    </div>
  );
}
