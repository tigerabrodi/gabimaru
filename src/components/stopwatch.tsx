import { Button } from '@/components/ui/button'
import {
  convertMsToSeconds,
  convertSecondsToMs,
  getDifferenceInMs,
} from '@/lib/utils'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type StopwatchState = 'idle' | 'running' | 'paused'

export function Stopwatch() {
  const [time, setTime] = useState(0)
  const [state, setState] = useState<StopwatchState>('idle')
  const startTimeRef = useRef(0)
  const animationFrameRef = useRef(0)

  const updateTime = useCallback(() => {
    if (!startTimeRef.current) return

    const elapsed = convertMsToSeconds(
      getDifferenceInMs({
        start: startTimeRef.current,
        end: Date.now(),
      })
    )

    setTime(elapsed)

    // This is recursive until we stop/pause the timer
    // We do requestAnimationFrame with the updateTime function
    // So we call this function again
    // requestAnimationFrame -> updateTime -> requestAnimationFrame -> updateTime -> requestAnimationFrame -> updateTime
    // Wonder what it does? Read: https://tigerabrodi.blog/i-finally-understand-requestanimationframe
    animationFrameRef.current = requestAnimationFrame(updateTime)
  }, [])

  const toggleTimer = () => {
    if (state === 'running') {
      cancelAnimationFrame(animationFrameRef.current)
      setState('paused')
    } else {
      if (state === 'idle') {
        startTimeRef.current = Date.now()
      } else {
        // Resuming - adjust start time to maintain elapsed time
        startTimeRef.current = Date.now() - convertSecondsToMs(time)
      }

      setState('running')
      updateTime()
    }
  }

  const resetTimer = () => {
    cancelAnimationFrame(animationFrameRef.current)
    setState('idle')
    setTime(0)
    startTimeRef.current = 0
  }

  useEffect(() => {
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [])

  // After a minute we want to have a full circle
  const degreesPerSecond = 360 / 60
  const rotation = (time % 60) * degreesPerSecond

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative size-72">
        <svg
          viewBox="0 0 100 100"
          className="size-full cursor-pointer"
          onClick={toggleTimer}
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="2"
          />

          {/* Orbiting dot */}
          <g transform={`rotate(${rotation} 50 50)`}>
            <circle cx="95" cy="50" r="3" fill="hsl(var(--primary))" />
          </g>

          <text
            x="50"
            y="55"
            textAnchor="middle"
            className="select-none font-mono text-sm"
            fill="hsl(var(--foreground))"
          >
            {/* Show two decimal places */}
            {time.toFixed(2)}
          </text>
        </svg>
      </div>

      <div className="flex gap-4">
        <Button onClick={toggleTimer} className="px-16 py-6">
          {state === 'running' ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        <Button onClick={resetTimer} className="size-12" variant="outline">
          <RotateCcw size={20} />
        </Button>
      </div>
    </div>
  )
}
