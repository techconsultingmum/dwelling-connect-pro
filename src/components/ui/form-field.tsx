import { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label 
        htmlFor={htmlFor} 
        className={cn(error && 'text-destructive')}
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCounter({ current, max, className }: CharacterCounterProps) {
  const isNearLimit = current > max * 0.9;
  const isOverLimit = current > max;
  
  return (
    <span 
      className={cn(
        'text-xs',
        isOverLimit ? 'text-destructive font-medium' : 
        isNearLimit ? 'text-warning' : 
        'text-muted-foreground',
        className
      )}
    >
      {current}/{max}
    </span>
  );
}