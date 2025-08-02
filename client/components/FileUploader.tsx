import { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Database, FileJson, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  hasData: boolean;
}

export default function FileUploader({
  onFileUpload,
  isLoading,
  hasData,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    const allowedTypes = [".csv", ".json", ".sqlite", ".db"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast.error("Please upload a CSV, JSON, or SQLite file");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      // 50MB limit
      toast.error("File size must be less than 50MB");
      return;
    }

    await onFileUpload(file);
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case "csv":
        return <FileText className="h-6 w-6" />;
      case "json":
        return <FileJson className="h-6 w-6" />;
      case "sqlite":
      case "db":
        return <Database className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        hasData ? "border-dashed" : "border-2 border-dashed",
        dragActive && "border-primary bg-primary/5",
      )}
    >
      <CardContent className="p-6">
        <div
          className="relative"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".csv,.json,.sqlite,.db"
            onChange={handleChange}
            disabled={isLoading}
          />

          {hasData ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">Data loaded successfully</p>
                  <p className="text-sm text-muted-foreground">
                    Upload a new file to replace current data
                  </p>
                </div>
              </div>
              <Button
                onClick={openFileDialog}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload New
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-primary" />
                )}
              </div>

              <h3 className="text-lg font-semibold mb-2">
                {isLoading ? "Processing file..." : "Upload your database"}
              </h3>

              <p className="text-muted-foreground mb-6">
                {isLoading
                  ? "Please wait while we process your file"
                  : "Drag and drop your file here, or click to browse"}
              </p>

              {!isLoading && (
                <>
                  <Button onClick={openFileDialog} className="mb-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getFileIcon("csv")}
                      <span>CSV Files</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getFileIcon("json")}
                      <span>JSON Files</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getFileIcon("sqlite")}
                      <span>SQLite Files</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-4">
                    Maximum file size: 50MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
