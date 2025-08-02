import { RequestHandler } from "express";
import { getCurrentData, setCurrentData } from "./upload";

export const handleUpdateRow: RequestHandler = (req, res) => {
  try {
    const { rowIndex, column, value } = req.body;

    if (typeof rowIndex !== "number" || !column) {
      return res.status(400).json({ error: "Invalid parameters" });
    }

    const { data, columns } = getCurrentData();

    if (rowIndex < 0 || rowIndex >= data.length) {
      return res.status(400).json({ error: "Row index out of bounds" });
    }

    if (!columns.includes(column)) {
      return res.status(400).json({ error: "Column not found" });
    }

    // Update the data
    const updatedData = [...data];
    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [column]: value,
    };

    // Save the updated data
    setCurrentData(updatedData, columns);

    res.json({
      message: "Row updated successfully",
      updatedRow: updatedData[rowIndex],
      rowIndex,
      column,
      newValue: value,
    });
  } catch (error) {
    console.error("Update row error:", error);
    res.status(500).json({
      error: "Failed to update row",
    });
  }
};
