import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Database,
  FileText,
  Grid3X3,
  BarChart3,
  Table,
  Download,
  Share2,
} from "lucide-react";
import FileUploader from "@/components/FileUploader";
import DataVisualization from "@/components/DataVisualization";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "cards" | "dashboard";

export default function Index() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      setData(result.data || []);
      setColumns(result.columns || []);
      toast.success(`Successfully uploaded ${file.name}`);
    } catch (error) {
      toast.error("Failed to upload file");
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "json") => {
    try {
      const response = await fetch(`/api/export?format=${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, columns }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `data.${format}`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Export error:", error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch("/api/share-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          columns,
          viewMode,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Share failed");
      }

      const result = await response.json();

      // Copy to clipboard
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to create share link");
      console.error("Share error:", error);
    }
  };

  return (
    <div className="container py-8">
      {/* Hero Section */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Database className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome to DataVault
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Upload your database files and visualize them in multiple formats.
            Edit data inline, export modifications, and share your designs with
            others.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            <Card className="text-center">
              <CardHeader>
                <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-sm">Multiple Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Upload CSV, JSON, or SQLite files
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Grid3X3 className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-sm">Multiple Views</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Table, cards, and dashboard visualization
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Share2 className="h-8 w-8 mx-auto text-primary mb-2" />
                <CardTitle className="text-sm">Share & Export</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Export data and share designs</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* File Upload */}
      <FileUploader
        onFileUpload={handleFileUpload}
        isLoading={isLoading}
        hasData={data.length > 0}
      />

      {/* Data Controls */}
      {data.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6 mt-8">
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {data.length} rows • {columns.length} columns
            </Badge>

            {/* View Mode Selector */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="h-8"
              >
                <Table className="h-4 w-4" />
                Table
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="h-8"
              >
                <Grid3X3 className="h-4 w-4" />
                Cards
              </Button>
              <Button
                variant={viewMode === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("dashboard")}
                className="h-8"
              >
                <BarChart3 className="h-4 w-4" />
                Charts
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("json")}
            >
              <Download className="h-4 w-4" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      )}

      {/* Data Visualization */}
      {data.length > 0 && (
        <DataVisualization
          data={data}
          columns={columns}
          viewMode={viewMode}
          onDataUpdate={(updatedData) => setData(updatedData)}
        />
      )}
    </div>
  );
}
