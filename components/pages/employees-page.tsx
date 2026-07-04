'use client'

import { useState, useTransition } from 'react'
import type { Employee } from '@/lib/types'
import { formatHourlyRate } from '@/lib/utils-custom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, CheckCircle, Circle } from 'lucide-react'
import { EmployeeModal } from '@/components/modals/employee-modal'
import { DeleteConfirmModal } from '@/components/modals/delete-confirm-modal'
import {
  createEmployeeAction,
  deleteEmployeeAction,
  saveEmployeeAction,
} from '@/app/actions/clofi'

interface EmployeesPageProps {
  initialEmployees: Employee[]
}

export function EmployeesPage({ initialEmployees }: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id?: string }>({
    show: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setShowModal(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowModal(true)
  }

  const handleSaveEmployee = (employee: Employee) => {
    startTransition(async () => {
      try {
        setError(null)
        const saved = employee.id
          ? await saveEmployeeAction(employee)
          : await createEmployeeAction(employee)

        setEmployees((current) => {
          const exists = current.some((item) => item.id === saved.id)
          if (exists) {
            return current.map((item) => (item.id === saved.id ? saved : item))
          }
          return [...current, saved]
        })
        setShowModal(false)
        setEditingEmployee(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo guardar el empleado')
      }
    })
  }

  const handleDeleteEmployee = (id: string) => {
    setDeleteConfirm({ show: true, id })
  }

  const confirmDelete = () => {
    if (!deleteConfirm.id) return

    startTransition(async () => {
      try {
        setError(null)
        await deleteEmployeeAction(deleteConfirm.id!)
        setEmployees((current) => current.filter((item) => item.id !== deleteConfirm.id))
        setDeleteConfirm({ show: false })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo eliminar el empleado')
      }
    })
  }

  const toggleEmployeeStatus = (employee: Employee) => {
    const updated = {
      ...employee,
      status: employee.status === 'active' ? 'inactive' : 'active',
    } as Employee

    startTransition(async () => {
      try {
        setError(null)
        const saved = await saveEmployeeAction(updated)
        setEmployees((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo actualizar el estado')
      }
    })
  }

  const activeCount = employees.filter((e) => e.status === 'active').length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empleados</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el personal ({activeCount} activos · {employees.length} total)
          </p>
        </div>
        <Button
          onClick={handleAddEmployee}
          disabled={isPending}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </Card>
      )}

      <Card className="p-6 bg-card border-border overflow-hidden">
        {employees.length === 0 ? (
          <div className="text-center py-8 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground text-sm">No hay empleados registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Nombre</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground hidden lg:table-cell">
                    Cargo
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Teléfono</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground hidden md:table-cell">
                    Tarifa/hora
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Estado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border hover:bg-accent/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-foreground font-medium">{employee.name}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden lg:table-cell">
                      {employee.position}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{employee.phone}</td>
                    <td className="py-3 px-4 text-foreground font-semibold hidden md:table-cell">
                      {formatHourlyRate(employee.hourlyRate)}/h
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => toggleEmployeeStatus(employee)}
                        disabled={isPending}
                        className="flex items-center gap-1 text-sm font-medium transition-colors"
                      >
                        {employee.status === 'active' ? (
                          <>
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-green-600">Activo</span>
                          </>
                        ) : (
                          <>
                            <Circle size={16} className="text-gray-400" />
                            <span className="text-gray-400">Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => handleEditEmployee(employee)}
                        disabled={isPending}
                        className="p-2 hover:bg-accent rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={16} className="text-primary" />
                      </button>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        disabled={isPending}
                        className="p-2 hover:bg-accent rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => {
            setShowModal(false)
            setEditingEmployee(null)
          }}
        />
      )}

      {deleteConfirm.show && (
        <DeleteConfirmModal
          title="Eliminar Empleado"
          message="¿Estás seguro que deseas eliminar este empleado? Esta acción no se puede deshacer."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false })}
        />
      )}
    </div>
  )
}
