import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Download,
  Share2,
  Table,
  Grid3X3,
  BarChart3,
  ExternalLink,
  Loader2,
} from "lucide-react";
import DataVisualization from "@/components/DataVisualization";
import type { ViewMode } from "@/pages/Index";

export default function SharedDesign() {
  const { shareId } = useParams<{ shareId: string }>();
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isLoading, setIsLoading] = useState(true);
  const [designInfo, setDesignInfo] = useState<any>(null);

  useEffect(() => {
    if (shareId) {
      fetchSharedDesign(shareId);
    }
  }, [shareId]);

  const fetchSharedDesign = async (id: string) => {
    try {
      const response = await fetch(`/api/shared/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Shared design not found");
        }
        throw new Error("Failed to load shared design");
      }

      const result = await response.json();
      setData(result.data || []);
      setColumns(result.columns || []);
      setViewMode(result.viewMode || "table");
      setDesignInfo(result);

      toast.success("Shared design loaded successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load shared design",
      );
      console.error("Fetch shared design error:", error);
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
      a.download = `shared-data.${format}`;
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
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Loading shared design...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we fetch the data.
          </p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="container py-8">
        <div className="text-center py-16">
          <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <ExternalLink className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Design Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The shared design you're looking for doesn't exist or has been
            removed.
          </p>
          <Button asChild>
            <a href="/">Go to DataVault</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Shared Design</Badge>
          <span className="text-sm text-muted-foreground">
            {designInfo?.createdAt &&
              new Date(designInfo.createdAt).toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Shared Database View</h1>
        <p className="text-muted-foreground">
          This is a shared view of a database with {data.length} rows and{" "}
          {columns.length} columns.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
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
            Copy Link
          </Button>
        </div>
      </div>

      {/* Data Visualization */}
      <DataVisualization
        data={data}
        columns={columns}
        viewMode={viewMode}
        onDataUpdate={() => {
          // Read-only for shared designs
          toast.info("This is a shared view. Editing is not available.");
        }}
      />

      {/* Footer Info */}
      <Card className="mt-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Shared from <strong>DataVault</strong> • Viewed{" "}
              {designInfo?.accessCount || 0} times
            </div>
            <div>
              <a href="/" className="text-primary hover:underline">
                Create your own database visualization
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
