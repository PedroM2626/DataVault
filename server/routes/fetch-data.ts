import { RequestHandler } from "express";
import { getCurrentData } from "./upload";

export const handleFetchData: RequestHandler = (req, res) => {
  try {
    const { data, columns } = getCurrentData();

    res.json({
      data,
      columns,
      rowCount: data.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Fetch data error:", error);
    res.status(500).json({
      error: "Failed to fetch data",
    });
  }
};
