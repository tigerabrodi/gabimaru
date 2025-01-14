import { Button } from '@/components/ui/button'
import {
  getSoundEffectManager,
  SOUND_EFFECTS,
} from '@/lib/sound-effect-manager'
import { convertMsToSeconds, getDifferenceInMs } from '@/lib/utils'
import { Pause, Play, Repeat, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAX_DIGITS = 6
const FULL_PROGRESS = 100
const PROGRESS_TO_PERCENTAGE = 100
const CIRCLE_RADIUS = 45

const SECOND_IN_SECONDS = 1
const TENS_OF_SECONDS_IN_SECONDS = 10
const MINUTE_IN_SECONDS = 60
const TENS_OF_MINUTES_IN_SECONDS = MINUTE_IN_SECONDS * 10 // 600
const HOUR_IN_SECONDS = MINUTE_IN_SECONDS * 60 // 3600
const TENS_OF_HOURS_IN_SECONDS = HOUR_IN_SECONDS * 10 // 36000

type TimerState = 'idle' | 'running' | 'paused' | 'editing' | 'finished'

const TIMER_STATE_TO_ICON_MAP: Record<TimerState, React.ReactNode> = {
  idle: <Play size={20} />,
  running: <Pause size={20} />,
  paused: <Play size={20} />,
  editing: <Play size={20} />,
  finished: <Repeat size={20} />,
}

function getDiameterByRadius(radius: number) {
  return radius * 2
}

export function Timer() {
  const [digits, setDigits] = useState<Array<number>>([])

  /* States */
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [progress, setProgress] = useState(0)
  const [shouldClearOnEdit, setShouldClearOnEdit] = useState(false)
  const [state, setState] = useState<TimerState>('idle')

  /* Refs */
  // From the time you started the timer
  // Date.now() - startTimeRef.current is the time elapsed since start
  // However, if you've paused and resumed, it's not the full time elapsed
  // That's why we need baseRemainingTimeRef
  const startTimeRef = useRef<number | null>(null)

  // baseRemainingTimeRef keeps track of the remaining time since last start
  // This is only needed because we support pause/resume feature
  const baseRemainingTimeRef = useRef<number | null>(null)
  const requestAnimationUpdateRef = useRef<number | null>(null)

  // Needed to keep track of initial total seconds
  // When resuming, we wanna show progress accurately
  // We use it in combinaiton with remainingTimeRef to calculate progress
  const initialTotalSecondsRef = useRef(0)

  const handleNumberInput = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const digit = parseInt(event.key)
    if (isNaN(digit)) return

    event.preventDefault()

    setState('editing')

    // If we should clear on edit and have existing value, start fresh
    if (totalSeconds > 0 && shouldClearOnEdit) {
      setDigits([digit])
      setShouldClearOnEdit(false)
    } else {
      setShouldClearOnEdit(false)
      const newDigits = [...digits, digit]

      // google timer format: hh:mm:ss
      // it is not bigger than 6 digits
      if (newDigits.length > MAX_DIGITS) newDigits.shift()
      setDigits(newDigits)
    }
  }

  // Update total seconds based on digits
  // We don't update digits state here
  // We do that in handleNumberInput or handleBackspace
  useEffect(() => {
    if (digits.length > 0) {
      let seconds = 0
      const digitsCopy = [...digits]

      // hh:mm:ss format with x showing digit position
      // Everything is in seconds here
      // First digit is single seconds        hh:mm:s{x}  = 1
      // Second digit is tens of seconds      hh:mm:{x}s  = 10
      // Third digit is single minutes        hh:m{x}:ss  = 60
      // Fourth digit is tens of minutes      hh:{x}m:ss  = 600
      // Fifth digit is single hours          h{x}:mm:ss  = 3600
      // Sixth digit is tens of hours         {x}h:mm:ss  = 36000

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * SECOND_IN_SECONDS
      }

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * TENS_OF_SECONDS_IN_SECONDS
      }

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * MINUTE_IN_SECONDS
      }

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * TENS_OF_MINUTES_IN_SECONDS
      }

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * HOUR_IN_SECONDS
      }

      if (digitsCopy.length >= 1) {
        seconds += digitsCopy.pop()! * TENS_OF_HOURS_IN_SECONDS
      }

      setTotalSeconds(seconds)
    }
  }, [digits])

  const handleBackspace = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const canRemoveDigits = event.key === 'Backspace' && digits.length > 0
    if (canRemoveDigits) {
      event.preventDefault()
      const newDigits = [...digits]
      newDigits.pop()

      if (newDigits.length === 0) {
        setDigits([])
        setTotalSeconds(0)
      } else {
        setDigits(newDigits)
      }
    }
  }

  const formatEditingTime = (seconds: number) => {
    const h = Math.floor(seconds / HOUR_IN_SECONDS)
    const m = Math.floor((seconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS)
    const s = seconds % MINUTE_IN_SECONDS

    // Always show full format during editing
    // padStart to fill with 0s if not enough digits
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatIdleTime = (seconds: number) => {
    const h = Math.floor(seconds / HOUR_IN_SECONDS)
    const m = Math.floor((seconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS)
    const s = seconds % MINUTE_IN_SECONDS

    const hasHours = h > 0
    if (hasHours) {
      return `${h}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`
    }

    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleCircleClick = () => {
    if (state === 'finished') {
      resetTimer()
      return
    }

    if (state === 'running' || state === 'paused') {
      toggleTimer()
      return
    }

    if (state === 'editing') {
      setState('idle')
      setShouldClearOnEdit(true)
    } else {
      setState('editing')
      setShouldClearOnEdit(true)
    }
  }

  const handleStop = () => {
    const soundEffectManager = getSoundEffectManager()
    soundEffectManager.play({ type: SOUND_EFFECTS.ALARM, shouldLoop: true })

    setState('finished')
    startTimeRef.current = null
    baseRemainingTimeRef.current = null
    setTotalSeconds(0)
    setDigits([])
    setProgress(0)
  }

  const updateTimer = () => {
    if (!startTimeRef.current || !baseRemainingTimeRef.current) return

    const elapsedSecondsFromNow = convertMsToSeconds(
      getDifferenceInMs({
        start: startTimeRef.current,
        end: Date.now(),
      })
    )

    // We use Math.max to ensure that the remaining time is never negative
    // We subtract the elapsed time from the remaining time
    // If you started, then paused after 5 seconds
    // Started again - The real elapsed time is not when you resumed
    // But it's all time that already passed before, no matter how many times you paused/resumed
    // So we subtract the elapsed time from the remaining time
    // PS. baseRemainingTimeRef is only updated when we pause
    // If we didn't support pause/resume baseRemainingTimeRef would NOT BE NEEDED at all
    const actualRemainingSecondsForTimer = Math.max(
      0,
      baseRemainingTimeRef.current - elapsedSecondsFromNow
    )

    // Math.ceil to round up to the nearest whole second
    // If 0.4 seconds left, we should not round down and show 0 seconds left!
    setTotalSeconds(Math.ceil(actualRemainingSecondsForTimer))

    const progressInDecimal =
      actualRemainingSecondsForTimer / initialTotalSecondsRef.current
    const progressInPercentage = progressInDecimal * PROGRESS_TO_PERCENTAGE
    setProgress(FULL_PROGRESS - progressInPercentage)

    if (actualRemainingSecondsForTimer > 0) {
      requestAnimationUpdateRef.current = requestAnimationFrame(updateTimer)
    } else {
      handleStop()
    }
  }

  function handlePause() {
    if (requestAnimationUpdateRef.current) {
      cancelAnimationFrame(requestAnimationUpdateRef.current)
    }

    if (startTimeRef.current) {
      const elapsed = convertMsToSeconds(
        getDifferenceInMs({
          start: startTimeRef.current,
          end: Date.now(),
        })
      )
      baseRemainingTimeRef.current = baseRemainingTimeRef.current
        ? baseRemainingTimeRef.current - elapsed
        : 0
    }
    startTimeRef.current = null
    setState('paused')
  }

  function handleStart() {
    startTimeRef.current = Date.now()
    baseRemainingTimeRef.current = totalSeconds
    initialTotalSecondsRef.current = totalSeconds
    updateTimer()
    setState('running')
  }

  function handleResume() {
    startTimeRef.current = Date.now()
    updateTimer()
    setState('running')
  }

  const toggleTimer = () => {
    if (state === 'finished') {
      resetTimer()
      return
    }

    if (state === 'running') {
      handlePause()
    } else {
      const isStartingNewTimer = baseRemainingTimeRef.current === null
      if (isStartingNewTimer) {
        handleStart()
      } else {
        handleResume()
      }
    }
  }

  const resetTimer = () => {
    if (requestAnimationUpdateRef.current) {
      cancelAnimationFrame(requestAnimationUpdateRef.current)
    }

    const soundEffectManager = getSoundEffectManager()
    soundEffectManager.stop({ type: SOUND_EFFECTS.ALARM })

    setState('idle')
    setProgress(0)
    startTimeRef.current = null
    baseRemainingTimeRef.current = null
    initialTotalSecondsRef.current = 0
    setTotalSeconds(0)
    setDigits([])
  }

  useEffect(() => {
    return () => {
      if (requestAnimationUpdateRef.current)
        cancelAnimationFrame(requestAnimationUpdateRef.current)
    }
  }, [])

  const isButtonDisabled = totalSeconds === 0 && state !== 'finished'

  return (
    <div
      className="flex flex-col items-center gap-8 focus:outline-none"
      // needed for keyboard navigation
      tabIndex={0}
      role="group"
      aria-label="Timer"
      onKeyDown={(event) => {
        if (state === 'editing') {
          handleNumberInput(event)
          handleBackspace(event)
        }
      }}
    >
      <title>
        {state === 'running'
          ? formatIdleTime(totalSeconds)
          : 'Gabimaru - Google Timer built in React'}
      </title>
      <div className="size-72">
        <svg
          viewBox="0 0 100 100"
          className="size-full cursor-pointer"
          onClick={handleCircleClick}
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="2"
          />

          {/* Light background to indicate editing */}
          {state === 'editing' && (
            <circle
              cx="50"
              cy="50"
              r={CIRCLE_RADIUS}
              fill="hsl(var(--secondary))"
              opacity="0.1"
            />
          )}

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={CIRCLE_RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            // Diameter is radius times 2
            // circumference is diameter times PI
            // circumference is the distance around the circle
            // if you were to place a line around the circle to measure, it would be the circumference
            strokeDasharray={`${Math.PI * getDiameterByRadius(CIRCLE_RADIUS)}`}
            // controls how much is hidden
            // it works backwards
            // the reason we need we need to subtract from 1 is to invert the behavior
            // Complete (progress = 100)
            // For example
            // When completed, we wanna show full
            // if we didn't have the 1
            // it'd be 282.74 times 1 (100/100) which is 282.74, so it'd hide the progress even though we wanna show it in full
            // circumference * (1 - 100/100)
            // = 282.74 * (1 - 1)
            // = 282.74 * 0
            // = 0
            strokeDashoffset={
              2 * Math.PI * CIRCLE_RADIUS * (1 - progress / 100)
            }
            // We wanna start from the top
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fill="hsl(var(--foreground))"
            className="select-none font-mono text-sm"
          >
            {state === 'editing'
              ? formatEditingTime(totalSeconds)
              : formatIdleTime(totalSeconds)}
          </text>
        </svg>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={toggleTimer}
          className="px-16 py-6"
          disabled={isButtonDisabled}
        >
          {TIMER_STATE_TO_ICON_MAP[state]}
        </Button>
        <Button onClick={resetTimer} className="size-12" variant="outline">
          <RotateCcw size={20} />
        </Button>
      </div>
    </div>
  )
}
