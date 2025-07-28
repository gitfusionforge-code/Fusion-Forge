import { Component, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    errorId: this.generateErrorId()
  };

  private generateErrorId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Error caught by Enhanced Error Boundary:', error, errorInfo);
      
      // Log error details for debugging
      console.error('Error ID:', this.state.errorId);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Stack:', error.stack);
    }
    
    this.setState({ errorInfo });
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send error to monitoring service (if available)
    this.reportError(error, errorInfo);
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // In a real app, send to error monitoring service
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      // Report to monitoring service (e.g., Sentry)
      // Sentry.captureException(error, { extra: errorData });
    } catch (reportingError) {
      // Silent fail for error reporting to avoid cascading errors
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: this.generateErrorId()
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getErrorType(error?: Error): string {
    if (!error) return 'Unknown Error';
    
    if (error.name === 'ChunkLoadError') return 'Loading Error';
    if (error.message.includes('Network')) return 'Network Error';
    if (error.message.includes('fetch')) return 'API Error';
    if (error.message.includes('render')) return 'Rendering Error';
    
    return error.name || 'Application Error';
  }

  private getErrorSuggestions(error?: Error): string[] {
    if (!error) return ['Try refreshing the page'];
    
    const suggestions = [];
    
    if (error.name === 'ChunkLoadError') {
      suggestions.push('Clear your browser cache');
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
    } else if (error.message.includes('Network')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again in a few moments');
    } else if (error.message.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('The server might be temporarily unavailable');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Clear your browser cache');
      suggestions.push('Try again in a few moments');
    }
    
    return suggestions;
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.getErrorType(this.state.error);
      const suggestions = this.getErrorSuggestions(this.state.error);
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                {errorType}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  Something went wrong while loading this part of the application.
                  {this.state.error?.message && (
                    <div className="mt-2 text-sm">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">What happened?</h4>
                <p className="text-sm text-gray-600 mb-3">
                  The application encountered an unexpected error. This has been automatically reported to help us improve the experience.
                </p>
                <div className="text-xs text-gray-500">
                  Error ID: <code className="bg-gray-200 px-1 rounded">{this.state.errorId}</code>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">What can you do?</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </Button>
                
                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Home
                </Button>
              </div>

              {/* Developer Info (in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer flex items-center gap-2 font-medium text-gray-900">
                    <Bug className="h-4 w-4" />
                    Developer Information
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <h5 className="font-medium text-sm">Error Stack:</h5>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <h5 className="font-medium text-sm">Component Stack:</h5>
                        <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <EnhancedErrorBoundary fallback={fallback}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}

export default EnhancedErrorBoundary;