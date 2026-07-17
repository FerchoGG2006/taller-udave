import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'neumorphic'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30": variant === 'primary',
            "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow": variant === 'secondary',
            "bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 shadow-md shadow-red-500/20": variant === 'danger',
            "neumorphic-btn text-slate-800 dark:text-slate-200 border-none font-bold": variant === 'neumorphic',
            "px-3 py-1.5 text-xs": size === 'sm',
            "px-4 py-2 text-sm": size === 'md',
            "px-6 py-3 text-base": size === 'lg',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
