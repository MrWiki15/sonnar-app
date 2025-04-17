
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonAnimatedProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const ButtonAnimated = forwardRef<HTMLButtonElement, ButtonAnimatedProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      ...props
    },
    ref
  ) => {
    const baseStyles = "relative overflow-hidden rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0 focus:outline-none";
    
    const variantStyles = {
      primary: "bg-fiesta-primary text-white shadow-md hover:shadow-lg hover:bg-fiesta-primary/90 focus:ring-2 focus:ring-fiesta-primary/50",
      secondary: "bg-fiesta-secondary text-white shadow-md hover:shadow-lg hover:bg-fiesta-secondary/90 focus:ring-2 focus:ring-fiesta-secondary/50",
      outline: "bg-transparent border border-fiesta-primary text-fiesta-primary hover:bg-fiesta-primary/5 focus:ring-2 focus:ring-fiesta-primary/50",
      ghost: "bg-transparent text-fiesta-primary hover:bg-fiesta-primary/5 focus:ring-2 focus:ring-fiesta-primary/50",
    };
    
    const sizeStyles = {
      sm: "text-xs py-2 px-3",
      md: "text-sm py-2.5 px-4",
      lg: "text-base py-3 px-6",
    };
    
    const widthStyle = fullWidth ? "w-full" : "";
    
    return (
      <button
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          widthStyle,
          isLoading ? "opacity-70 cursor-not-allowed" : "",
          className
        )}
        disabled={isLoading || props.disabled}
        ref={ref}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {children}
        </span>
        <span className="absolute inset-0 h-full w-full scale-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:bg-white/10"></span>
      </button>
    );
  }
);

ButtonAnimated.displayName = "ButtonAnimated";

export { ButtonAnimated };
