'use client'

import { useState } from 'react'
import type { Employee } from '@/lib/types'
import { roundHourlyRate } from '@/lib/utils-custom'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EmployeeModalProps {
  employee: Employee | null
  onSave: (employee: Employee) => void
  onClose: () => void
}

function hourlyRateToInputValue(rate: number): string {
  if (!rate) return ''
  return String(roundHourlyRate(rate))
}

function parseHourlyRateInput(value: string): number {
  if (!value.trim()) return 0
  const parsed = Number.parseFloat(value)
  if (Number.isNaN(parsed)) return 0
  return roundHourlyRate(parsed)
}

export function EmployeeModal({ employee, onSave, onClose }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>(
    employee || {
      id: '',
      name: '',
      position: '',
      phone: '',
      email: '',
      hourlyRate: 0,
      status: 'active',
      startDate: new Date(),
    },
  )

  const [hourlyRateInput, setHourlyRateInput] = useState(() =>
    hourlyRateToInputValue(employee?.hourlyRate ?? 0),
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'hourlyRate') {
      setHourlyRateInput(value)
      setFormData((prev) => ({
        ...prev,
        hourlyRate: parseHourlyRateInput(value),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const hourlyRate = parseHourlyRateInput(hourlyRateInput)

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (hourlyRate <= 0) newErrors.hourlyRate = 'La tarifa debe ser mayor a 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        ...formData,
        hourlyRate: parseHourlyRateInput(hourlyRateInput),
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: Juan García"
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: +503 7000 0000"
            />
            {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Correo (Opcional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: juan@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Salario por Hora (USD) *
            </label>
            <input
              type="number"
              name="hourlyRate"
              value={hourlyRateInput}
              onChange={handleChange}
              step="0.0001"
              min="0"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: 1.8765"
            />
            {errors.hourlyRate && (
              <p className="text-red-600 text-xs mt-1">{errors.hourlyRate}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
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
              {employee ? 'Actualizar' : 'Crear'} Empleado
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
