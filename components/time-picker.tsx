'use client'

import { Clock } from 'lucide-react'
import {
  buildTimeHHmm,
  formatTimeLabel,
  getCurrentTimeHHmm,
  parseTimeHHmm,
} from '@/lib/utils-custom'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const ENTRY_PRESETS = ['06:00', '07:00', '08:00', '09:00', '10:00']
const EXIT_PRESETS = ['12:00', '13:00', '17:00', '18:00', '19:00']

const fieldClassName =
  'w-full px-3 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-base appearance-none cursor-pointer'

interface TimePickerProps {
  id?: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  presetVariant?: 'entry' | 'exit'
  showNowButton?: boolean
  className?: string
}

export function TimePicker({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  presetVariant,
  showNowButton = true,
  className,
}: TimePickerProps) {
  const parsed = parseTimeHHmm(value)
  const presets =
    presetVariant === 'entry'
      ? ENTRY_PRESETS
      : presetVariant === 'exit'
        ? EXIT_PRESETS
        : []

  const handleHourChange = (hourValue: string) => {
    if (!hourValue) {
      onChange('')
      return
    }
    const hours = Number.parseInt(hourValue, 10)
    const minutes = parsed?.minutes ?? 0
    onChange(buildTimeHHmm(hours, minutes))
  }

  const handleMinuteChange = (minuteValue: string) => {
    if (parsed == null) return
    if (!minuteValue) {
      onChange('')
      return
    }
    const minutes = Number.parseInt(minuteValue, 10)
    onChange(buildTimeHHmm(parsed.hours, minutes))
  }

  const handlePreset = (preset: string) => {
    onChange(preset)
  }

  const handleNow = () => {
    onChange(getCurrentTimeHHmm())
  }

  const hourValue = parsed != null ? String(parsed.hours) : ''
  const minuteValue = parsed != null ? String(parsed.minutes) : ''

  return (
    <div className={cn('flex flex-col h-full space-y-2', className)}>
      <div className="flex items-center justify-between gap-2 min-h-[1.25rem]">
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {required ? ' *' : ''}
        </label>
        {showNowButton && (
          <button
            type="button"
            onClick={handleNow}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <Clock size={14} aria-hidden />
            Ahora
          </button>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col flex-1 rounded-lg border bg-background p-3 space-y-3 min-h-[9.5rem]',
          error ? 'border-red-500/70' : 'border-border',
        )}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              id={id}
              value={hourValue}
              onChange={(event) => handleHourChange(event.target.value)}
              aria-label={`${label} — hora`}
              className={fieldClassName}
            >
              <option value="">Hora</option>
              {HOURS.map((hour) => (
                <option key={hour} value={hour}>
                  {String(hour).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <span className="text-lg font-semibold text-muted-foreground select-none">:</span>

          <div className="relative flex-1 min-w-0">
            <select
              value={minuteValue}
              onChange={(event) => handleMinuteChange(event.target.value)}
              aria-label={`${label} — minutos`}
              disabled={!hourValue}
              className={cn(
                fieldClassName,
                !hourValue && 'opacity-50 cursor-not-allowed',
              )}
            >
              <option value="">Min</option>
              {MINUTES.map((minute) => (
                <option key={minute} value={minute}>
                  {String(minute).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {value && (
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-medium text-foreground">{value}</span>
            {' · '}
            {formatTimeLabel(value)}
          </p>
        )}

        {presets.length > 0 && (
          <div className="grid grid-cols-2 gap-1.5 mt-auto">
            {presets.map((preset, index) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-md border transition-colors text-center',
                  index === presets.length - 1 && presets.length % 2 !== 0 && 'col-span-2 max-w-[calc(50%-0.1875rem)] justify-self-center',
                  value === preset
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-accent/50 text-foreground hover:bg-accent',
                )}
              >
                {formatTimeLabel(preset)}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  )
}
