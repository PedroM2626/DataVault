import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleUpload, uploadMiddleware } from "./routes/upload";
import { handleFetchData } from "./routes/fetch-data";
import { handleUpdateRow } from "./routes/update-row";
import { handleExport } from "./routes/export";
import {
  handleShareDesign,
  handleGetSharedDesign,
} from "./routes/share-design";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Database management routes
  app.post("/api/upload", uploadMiddleware, handleUpload);
  app.get("/api/fetch-data", handleFetchData);
  app.post("/api/update-row", handleUpdateRow);
  app.post("/api/export", handleExport);
  app.post("/api/share-design", handleShareDesign);
  app.get("/api/shared/:shareId", handleGetSharedDesign);

  return app;
}
