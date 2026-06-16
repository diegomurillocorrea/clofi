'use client'

import { useMemo, useState, useTransition } from 'react'
import { AttendanceRecord, Employee } from '@/lib/types'
import { formatCurrency, formatDateShort } from '@/lib/utils-custom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Filter, Edit2 } from 'lucide-react'
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal'
import { AttendanceRecordModal } from '@/components/modals/attendance-record-modal'
import { deleteAttendanceRecordAction, saveAttendanceRecordAction } from '@/app/actions/clofi'

interface HistoryPageProps {
  initialEmployees: Employee[]
  initialRecords: AttendanceRecord[]
}

export function HistoryPage({ initialEmployees, initialRecords }: HistoryPageProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    status: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id?: string }>({
    show: false,
  })
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filters.employeeId && record.employeeId !== filters.employeeId) return false

      if (filters.startDate) {
        const startDate = new Date(filters.startDate)
        startDate.setHours(0, 0, 0, 0)
        const recordDate = new Date(record.date)
        recordDate.setHours(0, 0, 0, 0)
        if (recordDate < startDate) return false
      }

      if (filters.endDate) {
        const endDate = new Date(filters.endDate)
        endDate.setHours(23, 59, 59, 999)
        const recordDate = new Date(record.date)
        if (recordDate > endDate) return false
      }

      if (filters.status && filters.status === 'active') {
        const employee = initialEmployees.find((e) => e.id === record.employeeId)
        if (employee?.status !== 'active') return false
      }

      return true
    })
  }, [records, filters, initialEmployees])

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
    setFilters({
      employeeId: '',
      startDate: '',
      endDate: '',
      status: '',
    })
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
        <Button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
        >
          <Filter size={20} className="mr-2" />
          Filtros
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </Card>
      )}

      {showFilters && (
        <Card className="p-6 bg-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Empleado</label>
              <select
                name="employeeId"
                value={filters.employeeId}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Todos los empleados</option>
                {initialEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Estado del Empleado
              </label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha Inicio</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Fecha Fin</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={resetFilters}
              className="bg-accent text-accent-foreground hover:bg-accent/80"
            >
              Limpiar Filtros
            </Button>
          </div>
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
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No hay registros que coincidan con los filtros</p>
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
                {filteredRecords.map((record) => {
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
                })}
              </tbody>
            </table>
          </div>
        )}
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
