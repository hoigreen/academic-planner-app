import { CheckCircle2, Clock, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type CourseStatus = 'completed' | 'eligible' | 'locked' | 'planned'

interface CourseStatusBadgeProps {
  status: CourseStatus
  blockingReasons?: string[]
  compact?: boolean
}

const STATUS_CONFIG: Record<
  CourseStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  completed: {
    label: 'Done',
    icon: <CheckCircle2 className='h-3 w-3' />,
    className:
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  eligible: {
    label: 'Eligible',
    icon: <Clock className='h-3 w-3' />,
    className:
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  planned: {
    label: 'Planned',
    icon: <Clock className='h-3 w-3' />,
    className:
      'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  locked: {
    label: 'Locked',
    icon: <Lock className='h-3 w-3' />,
    className:
      'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700',
  },
}

export function CourseStatusBadge({
  status,
  blockingReasons = [],
  compact = false,
}: CourseStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const badge = (
    <Badge
      variant='outline'
      className={`inline-flex items-center gap-1 font-normal ${config.className}`}
    >
      {config.icon}
      {!compact && config.label}
    </Badge>
  )

  if (status === 'locked' && blockingReasons.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side='top' className='max-w-xs'>
            <p className='font-medium'>Prerequisites not met:</p>
            <ul className='mt-1 list-disc pl-4 text-xs'>
              {blockingReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return badge
}
