import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: string;
}

export default function ErrorFallback({ error, resetError, errorInfo }: ErrorFallbackProps) {
  const isDevelopment = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-light-grey flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-deep-blue">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            We encountered an unexpected error. This has been logged and our team will investigate.
          </p>
          
          {isDevelopment && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">Error Details (Development):</h4>
              <p className="text-xs text-gray-600 font-mono break-all">{error.message}</p>
              {errorInfo && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Stack Trace</summary>
                  <pre className="text-xs text-gray-500 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                    {errorInfo}
                  </pre>
                </details>
              )}
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={resetError}
              className="flex-1 bg-tech-orange hover:bg-orange-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}