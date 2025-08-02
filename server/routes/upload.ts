import { RequestHandler } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

// In-memory storage for demo purposes
// In production, you'd use a proper database
let currentData: any[] = [];
let currentColumns: string[] = [];

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".csv", ".json", ".sqlite", ".db"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

const parseCSV = (content: string): { data: any[]; columns: string[] } => {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return { data: [], columns: [] };

  const columns = lines[0]
    .split(",")
    .map((col) => col.trim().replace(/"/g, ""));
  const data = lines.slice(1).map((line) => {
    const values = line.split(",").map((val) => val.trim().replace(/"/g, ""));
    const row: any = {};
    columns.forEach((col, index) => {
      row[col] = values[index] || "";
    });
    return row;
  });

  return { data, columns };
};

const parseJSON = (content: string): { data: any[]; columns: string[] } => {
  try {
    const parsed = JSON.parse(content);
    let data: any[];

    if (Array.isArray(parsed)) {
      data = parsed;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      data = parsed.data;
    } else {
      data = [parsed];
    }

    if (data.length === 0) return { data: [], columns: [] };

    const columns = Object.keys(data[0]);
    return { data, columns };
  } catch (error) {
    throw new Error("Invalid JSON format");
  }
};

const parseSQLite = async (
  buffer: Buffer,
): Promise<{ data: any[]; columns: string[] }> => {
  // For SQLite, we'll need to use a library like sqlite3 or better-sqlite3
  // For now, returning a placeholder that suggests the feature needs implementation
  throw new Error(
    "SQLite parsing not yet implemented. Please use CSV or JSON files.",
  );
};

export const handleUpload: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const content = file.buffer.toString("utf8");

    let result: { data: any[]; columns: string[] };

    switch (ext) {
      case ".csv":
        result = parseCSV(content);
        break;
      case ".json":
        result = parseJSON(content);
        break;
      case ".sqlite":
      case ".db":
        result = await parseSQLite(file.buffer);
        break;
      default:
        return res.status(400).json({ error: "Unsupported file type" });
    }

    // Store in memory (in production, save to database)
    currentData = result.data;
    currentColumns = result.columns;

    res.json({
      message: "File uploaded successfully",
      data: result.data,
      columns: result.columns,
      rowCount: result.data.length,
      fileName: file.originalname,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed",
    });
  }
};

export const uploadMiddleware = upload.single("file");

// Export current data for other routes
export const getCurrentData = () => ({
  data: currentData,
  columns: currentColumns,
});
export const setCurrentData = (data: any[], columns: string[]) => {
  currentData = data;
  currentColumns = columns;
};
