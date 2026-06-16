'use client'

import { useMemo, useState } from 'react'
import { AttendanceRecord, Employee, PayrollReport } from '@/lib/types'
import { formatCurrency, formatDateShort, formatHourlyRate } from '@/lib/utils-custom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, Printer } from 'lucide-react'

interface ReportsPageProps {
  employees: Employee[]
  attendanceRecords: AttendanceRecord[]
}

export function ReportsPage({ employees, attendanceRecords }: ReportsPageProps) {
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const [report, setReport] = useState<PayrollReport | null>(null)

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const handleGenerateReport = () => {
    if (!filters.employeeId) return

    const employee = employees.find((e) => e.id === filters.employeeId)
    if (!employee) return

    const startDate = new Date(filters.startDate)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(filters.endDate)
    endDate.setHours(23, 59, 59, 999)

    const recordsInRange = attendanceRecords.filter((record) => {
      if (record.employeeId !== filters.employeeId) return false
      const recordDate = new Date(record.date)
      return recordDate >= startDate && recordDate <= endDate
    })

    const totalHours = recordsInRange.reduce((sum, r) => sum + r.hoursWorked, 0)
    const totalPayment = recordsInRange.reduce((sum, r) => sum + r.dailySalary, 0)

    setReport({
      employeeId: employee.id,
      employeeName: employee.name,
      startDate,
      endDate,
      hourlyRate: employee.hourlyRate,
      daysWorked: recordsInRange.length,
      totalHours,
      totalPayment,
      records: recordsInRange,
    })
  }

  const handlePrint = () => {
    if (!report) return
    window.print()
  }

  const handleDownload = () => {
    if (!report) return

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'Reporte de Nómina\n'
    csvContent += `Empleado:,${report.employeeName}\n`
    csvContent += `Período:,${formatDateShort(report.startDate)} a ${formatDateShort(report.endDate)}\n`
    csvContent += `Tarifa por Hora:,${formatHourlyRate(report.hourlyRate)}\n\n`

    csvContent += 'Fecha,Entrada,Salida,Horas,Salario\n'
    report.records.forEach((record) => {
      csvContent += `${formatDateShort(record.date)},${record.entryTime},${record.exitTime},${record.hoursWorked.toFixed(2)},${formatCurrency(record.dailySalary)}\n`
    })

    csvContent += '\nResumen\n'
    csvContent += `Días Trabajados:,${report.daysWorked}\n`
    csvContent += `Total Horas:,${report.totalHours.toFixed(2)}\n`
    csvContent += `Total a Pagar:,${formatCurrency(report.totalPayment)}\n`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `reporte-${report.employeeName}-${report.startDate.getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const employeeOptions = useMemo(
    () => employees.filter((employee) => employee.status === 'active'),
    [employees],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reportes de Nómina</h1>
        <p className="text-muted-foreground mt-1">
          Genera reportes de pagos por empleado y período
        </p>
      </div>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">Parámetros del Reporte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Empleado *</label>
            <select
              name="employeeId"
              value={filters.employeeId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            >
              <option value="">Seleccionar empleado...</option>
              {employeeOptions.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Fecha Inicial</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Fecha Final</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerateReport}
          className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <BarChart3 size={20} className="mr-2" />
          Generar Reporte
        </Button>
      </Card>

      {report && (
        <div className="space-y-4">
          <Card className="p-6 bg-card border-border print:break-inside-avoid">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Empleado</p>
                <p className="text-2xl font-bold text-foreground">{report.employeeName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="text-lg font-bold text-foreground">
                  {formatDateShort(report.startDate)} - {formatDateShort(report.endDate)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-b border-border py-4">
              <div>
                <p className="text-xs text-muted-foreground">Días Trabajados</p>
                <p className="text-2xl font-bold text-foreground">{report.daysWorked}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Horas</p>
                <p className="text-2xl font-bold text-foreground">{report.totalHours.toFixed(2)}h</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tarifa/Hora</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatHourlyRate(report.hourlyRate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total a Pagar</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(report.totalPayment)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border print:break-inside-avoid">
            <h3 className="text-lg font-bold text-foreground mb-4">Desglose por Día</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Entrada</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Salida</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Horas</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Salario</th>
                  </tr>
                </thead>
                <tbody>
                  {report.records.map((record) => (
                    <tr key={record.id} className="border-b border-border">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {formatDateShort(record.date)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{record.entryTime}</td>
                      <td className="py-3 px-4 text-muted-foreground">{record.exitTime || '—'}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {record.hoursWorked.toFixed(2)}h
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(record.dailySalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex gap-3 print:hidden">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Printer size={20} className="mr-2" />
              Imprimir
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download size={20} className="mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
