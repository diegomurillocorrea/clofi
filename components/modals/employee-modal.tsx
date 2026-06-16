'use client'

import { useState } from 'react'
import { Employee } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EmployeeModalProps {
  employee: Employee | null
  onSave: (employee: Employee) => void
  onClose: () => void
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
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'hourlyRate' ? parseFloat(value) || 0 : 
        name === 'startDate' ? new Date(value) :
        value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido'
    if (!formData.position.trim()) newErrors.position = 'El cargo es requerido'
    if (!formData.phone.trim()) newErrors.phone = 'El teléfono es requerido'
    if (formData.hourlyRate <= 0) newErrors.hourlyRate = 'La tarifa debe ser mayor a 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
        {/* Header */}
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

        {/* Form */}
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
              Cargo/Puesto *
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: Desarrollador"
            />
            {errors.position && <p className="text-red-600 text-xs mt-1">{errors.position}</p>}
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
              placeholder="Ej: +1-234-567-8900"
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
              value={formData.hourlyRate}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Ej: 25.00"
            />
            {errors.hourlyRate && (
              <p className="text-red-600 text-xs mt-1">{errors.hourlyRate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Fecha de Ingreso
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate.toISOString().split('T')[0]}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          {/* Buttons */}
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
