'use client'

import { useMemo, useState, useTransition } from 'react'
import { AttendanceRecord, Employee } from '@/lib/types'
import { formatCurrency, formatDateShort, getLocalDateKey } from '@/lib/utils-custom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, X } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal'
import { AttendanceRecordModal } from '@/components/modals/attendance-record-modal'
import { deleteAttendanceRecordAction, saveAttendanceRecordAction } from '@/app/actions/clofi'

interface HistoryPageProps {
  initialEmployees: Employee[]
  initialRecords: AttendanceRecord[]
}

const emptyFilters = {
  employeeId: '',
  date: '',
  entryTime: '',
  exitTime: '',
  hours: '',
  salary: '',
}

type ColumnFilters = typeof emptyFilters

function matchesNumericFilter(value: number, filter: string, decimals = 1) {
  const trimmed = filter.trim()
  if (!trimmed) return true

  const normalizedValue = value.toFixed(decimals)
  if (normalizedValue.includes(trimmed)) return true

  const parsed = Number(trimmed.replace(',', '.').replace(/[^\d.-]/g, ''))
  if (Number.isNaN(parsed)) return false

  return Math.abs(value - parsed) < 0.01
}

const filterInputClassName =
  'mt-2 w-full min-w-[7rem] rounded-md border border-border bg-background px-2 py-1.5 text-xs font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary'

export function HistoryPage({ initialEmployees, initialRecords }: HistoryPageProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [filters, setFilters] = useState<ColumnFilters>(emptyFilters)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id?: string }>({
    show: false,
  })
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasActiveFilters = Object.values(filters).some((value) => value !== '')

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filters.employeeId && record.employeeId !== filters.employeeId) return false

      if (filters.date && getLocalDateKey(new Date(record.date)) !== filters.date) {
        return false
      }

      if (filters.entryTime && !record.entryTime.includes(filters.entryTime.trim())) {
        return false
      }

      if (filters.exitTime) {
        const exitTime = record.exitTime?.trim() || ''
        if (!exitTime.includes(filters.exitTime.trim())) return false
      }

      if (!matchesNumericFilter(record.hoursWorked, filters.hours, 1)) return false
      if (!matchesNumericFilter(record.dailySalary, filters.salary, 2)) return false

      return true
    })
  }, [records, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleDeleteRecord = (id: string) => {
    setDeleteConfirm({ show: true, id })
  }

  const confirmDelete = () => {
    if (!deleteConfirm.id) return

    startTransition(async () => {
      try {
        setError(null)
        await deleteAttendanceRecordAction(deleteConfirm.id!)
        setRecords((current) => current.filter((item) => item.id !== deleteConfirm.id))
        setDeleteConfirm({ show: false })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el registro')
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el registro')
      }
    })
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
  }

  const totalHours = filteredRecords.reduce((sum, r) => sum + r.hoursWorked, 0)
  const totalPayment = filteredRecords.reduce((sum, r) => sum + r.dailySalary, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historial de Asistencia</h1>
          <p className="text-muted-foreground mt-1">
            Visualiza y administra todos los registros de asistencia
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            onClick={resetFilters}
            className="bg-accent text-accent-foreground hover:bg-accent/80 w-full md:w-auto"
          >
            <X size={18} className="mr-2" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground font-medium">Total de Horas</p>
          <p className="text-3xl font-bold text-foreground mt-2">{totalHours.toFixed(1)}h</p>
        </Card>
        <Card className="p-6 bg-card border-border">
          <p className="text-sm text-muted-foreground font-medium">Total a Pagar</p>
          <p className="text-3xl font-bold text-primary mt-2">{formatCurrency(totalPayment)}</p>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border align-bottom">
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Empleado</span>
                  <select
                    name="employeeId"
                    value={filters.employeeId}
                    onChange={handleFilterChange}
                    aria-label="Filtrar por empleado"
                    className={filterInputClassName}
                  >
                    <option value="">Todos</option>
                    {initialEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">
                  <span className="block">Fecha</span>
                  <input
                    type="date"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                    aria-label="Filtrar por fecha"
                    className={filterInputClassName}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Entrada</span>
                  <input
                    type="time"
                    name="entryTime"
                    value={filters.entryTime}
                    onChange={handleFilterChange}
                    aria-label="Filtrar por hora de entrada"
                    className={filterInputClassName}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Salida</span>
                  <input
                    type="time"
                    name="exitTime"
                    value={filters.exitTime}
                    onChange={handleFilterChange}
                    aria-label="Filtrar por hora de salida"
                    className={filterInputClassName}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Horas</span>
                  <input
                    type="text"
                    name="hours"
                    value={filters.hours}
                    onChange={handleFilterChange}
                    placeholder="Ej. 9"
                    inputMode="decimal"
                    aria-label="Filtrar por horas"
                    className={filterInputClassName}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Salario</span>
                  <input
                    type="text"
                    name="salary"
                    value={filters.salary}
                    onChange={handleFilterChange}
                    placeholder="Ej. 12.50"
                    inputMode="decimal"
                    aria-label="Filtrar por salario"
                    className={filterInputClassName}
                  />
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  <span className="block">Acciones</span>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className={`${filterInputClassName} text-left text-muted-foreground hover:text-foreground`}
                      title="Limpiar filtros"
                    >
                      Limpiar
                    </button>
                  ) : (
                    <div className="mt-2 h-[30px]" aria-hidden />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-4 text-center text-muted-foreground"
                  >
                    {records.length === 0
                      ? 'No hay registros de asistencia'
                      : 'No hay registros que coincidan con los filtros'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const employee = initialEmployees.find((e) => e.id === record.employeeId)
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-accent/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">{employee?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                        {formatDateShort(record.date)}
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
                            onClick={() => handleDeleteRecord(record.id)}
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
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {deleteConfirm.show && (
        <DeleteConfirmModal
          title="Eliminar Registro"
          message="¿Estás seguro que deseas eliminar este registro de asistencia? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false })}
        />
      )}

      {editingRecord && (
        <AttendanceRecordModal
          record={editingRecord}
          employees={initialEmployees}
          onSave={handleSaveEdit}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  )
}
