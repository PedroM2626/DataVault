import { ReactNode } from "react";
import { useLocation, useInRouterContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  Database,
  Upload,
  Download,
  Share2,
  Sun,
  Moon,
  LayoutGrid,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const isSharedPage = location.pathname.startsWith("/shared/");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DataVault</h1>
              <p className="text-xs text-muted-foreground">
                Database Management Platform
              </p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-2">
            {!isSharedPage && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".csv,.json,.sqlite,.db";
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>

                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <LayoutGrid className="h-4 w-4" />
                  Styles
                </Button>

                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Download className="h-4 w-4" />
                  Export
                </Button>

                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </>
            )}

            {isSharedPage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/")}
              >
                <Database className="h-4 w-4" />
                Create Your Own
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
