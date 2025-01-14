import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SECOND_IN_MS } from './constants'

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs))
}

export function convertMsToSeconds(ms: number) {
  return ms / SECOND_IN_MS
}

export function convertSecondsToMs(seconds: number) {
  return seconds * SECOND_IN_MS
}

export function getDifferenceInMs({
  start,
  end,
}: {
  start: number
  end: number
}) {
  return end - start
}
