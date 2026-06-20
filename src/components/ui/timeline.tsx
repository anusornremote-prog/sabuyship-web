import * as React from "react"
import { cn } from "@/lib/utils"

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-4", className)}
      {...props}
    />
  )
)
Timeline.displayName = "Timeline"

export interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string
  date?: string
  description?: string
  isLast?: boolean
  isActive?: boolean
}

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, status, date, description, isLast, isActive, ...props }, ref) => (
    <div ref={ref} className={cn("relative flex gap-4", className)} {...props}>
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border-2",
            isActive
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted bg-background text-muted-foreground"
          )}
        >
          {isActive ? (
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 mt-2",
              isActive ? "bg-primary" : "bg-muted"
            )}
          />
        )}
      </div>
      <div className="flex flex-col pb-6 pt-1">
        <h4 className="font-semibold text-sm leading-none mb-1">{status}</h4>
        {date && (
          <span className="text-xs text-muted-foreground mb-2">{date}</span>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
)
TimelineItem.displayName = "TimelineItem"

export { Timeline, TimelineItem }
