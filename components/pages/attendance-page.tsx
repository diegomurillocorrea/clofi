'use client'

import { useState, useTransition } from 'react'
import { Employee, AttendanceRecord } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  calculateHoursWorked,
  calculateDailySalary,
  isValidTimeFormat,
  formatCurrency,
} from '@/lib/utils-custom'
import { Clock, Edit2, Trash2 } from 'lucide-react'
import { saveAttendanceRecordAction, deleteAttendanceRecordAction } from '@/app/actions/clofi'
import { AttendanceRecordModal } from '@/components/modals/attendance-record-modal'
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal'

interface AttendancePageProps {
  initialEmployees: Employee[]
  initialRecords: AttendanceRecord[]
}

export function AttendancePage({
  initialEmployees,
  initialRecords,
}: AttendancePageProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    entryTime: '',
    exitTime: '',
    observations: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id?: string }>({
    show: false,
  })
  const [isPending, startTransition] = useTransition()

  const activeEmployees = initialEmployees.filter((e) => e.status === 'active')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.employeeId) newErrors.employeeId = 'Selecciona un empleado'
    if (!formData.entryTime) newErrors.entryTime = 'Hora de entrada requerida'
    if (!formData.exitTime) newErrors.exitTime = 'Hora de salida requerida'

    if (formData.entryTime && !isValidTimeFormat(formData.entryTime)) {
      newErrors.entryTime = 'Formato inválido (HH:mm)'
    }
    if (formData.exitTime && !isValidTimeFormat(formData.exitTime)) {
      newErrors.exitTime = 'Formato inválido (HH:mm)'
    }

    if (formData.entryTime && formData.exitTime) {
      const hours = calculateHoursWorked(formData.entryTime, formData.exitTime)
      if (hours <= 0) {
        newErrors.exitTime = 'La hora de salida debe ser después de la entrada'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const employee = initialEmployees.find((item) => item.id === formData.employeeId)
    if (!employee) return

    const hoursWorked = calculateHoursWorked(formData.entryTime, formData.exitTime)
    const dailySalary = calculateDailySalary(hoursWorked, employee.hourlyRate)

    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: formData.employeeId,
      date: new Date(formData.date + 'T12:00:00'),
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      dailySalary: Math.round(dailySalary * 100) / 100,
      observations: formData.observations || undefined,
    }

    startTransition(async () => {
      try {
        setError(null)
        const saved = await saveAttendanceRecordAction(newRecord)
        setRecords((current) => [saved, ...current])
        setFormData({
          employeeId: '',
          date: new Date().toISOString().split('T')[0],
          entryTime: '',
          exitTime: '',
          observations: '',
        })
        setSuccessMessage('Registro guardado exitosamente')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el registro')
      }
    })
  }

  const handleSaveEdit = (updated: AttendanceRecord) => {
    startTransition(async () => {
      try {
        setError(null)
        const saved = await saveAttendanceRecordAction(updated)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
        setEditingRecord(null)
        setSuccessMessage('Registro actualizado exitosamente')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el registro')
      }
    })
  }

  const confirmDelete = () => {
    if (!deleteConfirm.id) return

    startTransition(async () => {
      try {
        setError(null)
        await deleteAttendanceRecordAction(deleteConfirm.id!)
        setRecords((current) => current.filter((item) => item.id !== deleteConfirm.id))
        setDeleteConfirm({ show: false })
        setSuccessMessage('Registro eliminado')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Registro de Asistencia</h1>
        <p className="text-muted-foreground mt-1">Registra entrada y salida de empleados</p>
      </div>

      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </Card>
      )}

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Nuevo Registro</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Empleado *
              </label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Seleccionar empleado...</option>
                {activeEmployees.map((emp) => (
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
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Hora de Entrada (HH:mm) *
              </label>
              <input
                type="time"
                name="entryTime"
                value={formData.entryTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              {errors.entryTime && (
                <p className="text-red-600 text-xs mt-1">{errors.entryTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Hora de Salida (HH:mm) *
              </label>
              <input
                type="time"
                name="exitTime"
                value={formData.exitTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
              {errors.exitTime && (
                <p className="text-red-600 text-xs mt-1">{errors.exitTime}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              name="observations"
              value={formData.observations}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              placeholder="Notas adicionales..."
            />
          </div>

          {formData.employeeId && formData.entryTime && formData.exitTime && !errors.exitTime && (
            <div className="p-4 bg-accent rounded-lg">
              {(() => {
                const employee = initialEmployees.find((e) => e.id === formData.employeeId)
                const hours = calculateHoursWorked(formData.entryTime, formData.exitTime)
                const salary = employee ? calculateDailySalary(hours, employee.hourlyRate) : 0
                return (
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Horas:</p>
                      <p className="font-bold text-foreground">{hours.toFixed(2)}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tarifa:</p>
                      <p className="font-bold text-foreground">
                        {formatCurrency(employee?.hourlyRate || 0)}/h
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pago:</p>
                      <p className="font-bold text-primary">{formatCurrency(salary)}</p>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Clock size={20} className="mr-2" />
            Guardar Registro
          </Button>
        </form>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Últimos Registros</h2>
        {records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay registros de asistencia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Empleado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Entrada</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Salida</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Horas</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Salario</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {records.slice(0, 10).map((record) => {
                  const employee = initialEmployees.find((e) => e.id === record.employeeId)
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">{employee?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {record.date.toLocaleDateString('es-ES')}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{record.entryTime}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.exitTime || '—'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.hoursWorked.toFixed(1)}h
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(record.dailySalary)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(record)}
                            disabled={isPending}
                            className="p-2 hover:bg-accent rounded transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={16} className="text-primary" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ show: true, id: record.id })}
                            disabled={isPending}
                            className="p-2 hover:bg-accent rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editingRecord && (
        <AttendanceRecordModal
          record={editingRecord}
          employees={initialEmployees}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}

      {deleteConfirm.show && (
        <DeleteConfirmModal
          title="Eliminar Registro"
          message="¿Estás seguro que deseas eliminar este registro de asistencia? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false })}
        />
      )}
    </div>
  )
}
