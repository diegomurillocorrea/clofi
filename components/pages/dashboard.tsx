'use client'

import { useMemo } from 'react'
import { formatCurrency } from '@/lib/utils-custom'
import { Card } from '@/components/ui/card'
import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react'
import type { AttendanceRecord, Employee } from '@/lib/types'

interface DashboardProps {
  employees: Employee[]
  attendanceRecords: AttendanceRecord[]
}

export function Dashboard({ employees, attendanceRecords }: DashboardProps) {
  const stats = useMemo(() => {
    const activeEmployees = employees.filter((e) => e.status === 'active').length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayRecords = attendanceRecords.filter((r) => {
      const recordDate = new Date(r.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === today.getTime()
    })

    const totalHoursToday = todayRecords.reduce((sum, r) => sum + r.hoursWorked, 0)
    const totalPaymentToday = todayRecords.reduce((sum, r) => sum + r.dailySalary, 0)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weekRecords = attendanceRecords.filter((r) => {
      const recordDate = new Date(r.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate >= weekAgo && recordDate <= today
    })

    const totalPaymentWeek = weekRecords.reduce((sum, r) => sum + r.dailySalary, 0)

    return {
      activeEmployees,
      totalHoursToday,
      totalPaymentToday,
      totalPaymentWeek,
      todayRecords,
    }
  }, [employees, attendanceRecords])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bienvenido a Clofi</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona empleados, asistencia y nómina de forma sencilla
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Empleados Activos</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stats.activeEmployees}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="text-primary" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Horas Hoy</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {stats.totalHoursToday.toFixed(1)}h
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Clock className="text-primary" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pago Hoy</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatCurrency(stats.totalPaymentToday)}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="text-primary" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Pago Esta Semana</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {formatCurrency(stats.totalPaymentWeek)}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="text-primary" size={24} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Últimos Registros</h2>

        {stats.todayRecords.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay registros de hoy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Empleado</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Entrada</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Salida</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Horas</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Salario</th>
                </tr>
              </thead>
              <tbody>
                {stats.todayRecords.map((record) => {
                  const employee = employees.find((e) => e.id === record.employeeId)
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border hover:bg-accent transition-colors"
                    >
                      <td className="py-3 px-4 text-foreground font-medium">{employee?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{record.entryTime}</td>
                      <td className="py-3 px-4 text-muted-foreground">{record.exitTime}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.hoursWorked.toFixed(1)}h
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(record.dailySalary)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
