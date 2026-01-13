import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  indicatorColor?: string
}

function Progress({
  className,
  indicatorColor,
  value,
  style,
  ...props
}: ProgressProps) {
  const hasCustomColor = style && '--progress-foreground' in style

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gradient-to-r from-[oklch(0.88_0.02_145)] to-[oklch(0.90_0.015_155)] dark:from-[oklch(0.28_0.02_145)] dark:to-[oklch(0.30_0.015_155)]",
        className
      )}
      style={style}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-500 ease-out",
          !indicatorColor && !hasCustomColor && "bg-gradient-to-r from-[oklch(0.72_0.14_150)] via-[oklch(0.75_0.13_155)] to-[oklch(0.78_0.12_160)]"
        )}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          ...(indicatorColor ? { background: indicatorColor } : hasCustomColor ? { background: 'var(--progress-foreground)' } : {}),
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
