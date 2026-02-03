import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorAlert({ 
  title = "Something went wrong", 
  message, 
  onRetry,
  className 
}: ErrorAlertProps) {
  return (
    <div 
      className={cn(
        "rounded-lg border border-destructive/20 bg-destructive/5 p-4",
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-destructive" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-destructive">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 gap-2" 
              onClick={onRetry}
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive flex items-center gap-1.5 mt-1" role="alert">
      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
