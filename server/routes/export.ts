import { RequestHandler } from "express";

const convertToCSV = (data: any[], columns: string[]): string => {
  const header = columns.join(",");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col] || "";
        // Escape commas and quotes in CSV
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(",") ||
          escaped.includes('"') ||
          escaped.includes("\n")
          ? `"${escaped}"`
          : escaped;
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
};

export const handleExport: RequestHandler = (req, res) => {
  try {
    const { data, columns, format } = req.body;
    const exportFormat = req.query.format || format;

    if (!data || !columns) {
      return res.status(400).json({ error: "Data and columns are required" });
    }

    if (!Array.isArray(data) || !Array.isArray(columns)) {
      return res.status(400).json({ error: "Data and columns must be arrays" });
    }

    let content: string;
    let mimeType: string;
    let filename: string;

    switch (exportFormat) {
      case "csv":
        content = convertToCSV(data, columns);
        mimeType = "text/csv";
        filename = "data.csv";
        break;
      case "json":
        content = JSON.stringify(data, null, 2);
        mimeType = "application/json";
        filename = "data.json";
        break;
      default:
        return res
          .status(400)
          .json({ error: "Invalid format. Use csv or json" });
    }

    res.set({
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": Buffer.byteLength(content, "utf8").toString(),
    });

    res.send(content);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({
      error: "Failed to export data",
    });
  }
};
