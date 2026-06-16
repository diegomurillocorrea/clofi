'use client'

import { useState } from 'react'
import { AttendanceRecord, Employee } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  calculateDailySalary,
  calculateHoursWorked,
  formatCurrency,
  formatHourlyRate,
  isValidTimeFormat,
} from '@/lib/utils-custom'
import { X } from 'lucide-react'
import { TimePicker } from '@/components/time-picker'

interface AttendanceRecordModalProps {
  record: AttendanceRecord
  employees: Employee[]
  onSave: (record: AttendanceRecord) => void
  onClose: () => void
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AttendanceRecordModal({
  record,
  employees,
  onSave,
  onClose,
}: AttendanceRecordModalProps) {
  const [formData, setFormData] = useState({
    employeeId: record.employeeId,
    date: toDateInputValue(new Date(record.date)),
    entryTime: record.entryTime,
    exitTime: record.exitTime || '',
    observations: record.observations || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleTimeChange = (name: 'entryTime' | 'exitTime', value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const nextErrors: Record<string, string> = {}

    if (!formData.employeeId) nextErrors.employeeId = 'Selecciona un empleado'
    if (!formData.entryTime) nextErrors.entryTime = 'Hora de entrada requerida'

    if (formData.entryTime && !isValidTimeFormat(formData.entryTime)) {
      nextErrors.entryTime = 'Formato inválido (HH:mm)'
    }
    if (formData.exitTime && !isValidTimeFormat(formData.exitTime)) {
      nextErrors.exitTime = 'Formato inválido (HH:mm)'
    }

    if (formData.entryTime && formData.exitTime) {
      const hours = calculateHoursWorked(formData.entryTime, formData.exitTime)
      if (hours <= 0) {
        nextErrors.exitTime = 'La hora de salida debe ser después de la entrada'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const employee = employees.find((item) => item.id === formData.employeeId)
    if (!employee) return

    const hoursWorked = formData.exitTime
      ? calculateHoursWorked(formData.entryTime, formData.exitTime)
      : 0
    const dailySalary = formData.exitTime
      ? calculateDailySalary(hoursWorked, employee.hourlyRate)
      : 0

    onSave({
      id: record.id,
      employeeId: formData.employeeId,
      date: new Date(formData.date + 'T12:00:00'),
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      dailySalary: Math.round(dailySalary * 100) / 100,
      observations: formData.observations || undefined,
    })
  }

  const previewEmployee = employees.find((item) => item.id === formData.employeeId)
  const previewHours =
    formData.entryTime && formData.exitTime
      ? calculateHoursWorked(formData.entryTime, formData.exitTime)
      : 0
  const previewSalary = previewEmployee
    ? calculateDailySalary(previewHours, previewEmployee.hourlyRate)
    : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Editar Registro</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Empleado *</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Seleccionar empleado...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.position}
                  </option>
                ))}
              </select>
              {errors.employeeId && (
                <p className="text-red-600 text-xs mt-1">{errors.employeeId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            <TimePicker
              id="edit-entryTime"
              label="Hora de Entrada"
              value={formData.entryTime}
              onChange={(value) => handleTimeChange('entryTime', value)}
              error={errors.entryTime}
              required
              presetVariant="entry"
              className="h-full"
            />

            <TimePicker
              id="edit-exitTime"
              label="Hora de Salida"
              value={formData.exitTime}
              onChange={(value) => handleTimeChange('exitTime', value)}
              error={errors.exitTime}
              presetVariant="exit"
              className="h-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Notas adicionales..."
            />
          </div>

          {formData.employeeId && formData.entryTime && formData.exitTime && previewHours > 0 && (
            <div className="p-4 bg-accent rounded-lg grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Horas:</p>
                <p className="font-bold text-foreground">{previewHours.toFixed(2)}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tarifa:</p>
                <p className="font-bold text-foreground">
                  {formatHourlyRate(previewEmployee?.hourlyRate || 0)}/h
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Pago:</p>
                <p className="font-bold text-primary">{formatCurrency(previewSalary)}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
