import { cn } from "@/lib/utils"
import { Panel } from "@/components/ui/panel"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

/** Loading placeholder for a grid of Panel cards (projects, assets). */
function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Panel key={i} className="flex flex-col gap-3 p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </Panel>
      ))}
    </div>
  )
}

/** Loading placeholder for a stacked list of rows (tasks, notes, activity). */
function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Panel className="flex flex-col divide-y divide-subtle p-0">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </Panel>
  )
}

export { Skeleton, CardGridSkeleton, ListSkeleton }
