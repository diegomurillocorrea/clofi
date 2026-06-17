'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AttendanceRecord, Employee } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignaturePad, type SignaturePadHandle } from '@/components/signature-pad'
import {
  calculateDailySalary,
  calculateHoursWorked,
} from '@/lib/utils-custom'
import { Clock, LogOut, LogIn, CheckCircle2, AlertCircle, User } from 'lucide-react'
import { saveAttendanceRecordAction } from '@/app/actions/clofi'

type KioskMode = 'check-in' | 'check-out' | 'done'

interface EmployeeAttendanceKioskProps {
  employees: Employee[]
  initialRecords: AttendanceRecord[]
}

export function EmployeeAttendanceKiosk({
  employees,
  initialRecords,
}: EmployeeAttendanceKioskProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [kioskMode, setKioskMode] = useState<KioskMode>('check-in')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [currentTime, setCurrentTime] = useState('')
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const entrySignaturePadRef = useRef<SignaturePadHandle>(null)
  const exitSignaturePadRef = useRef<SignaturePadHandle>(null)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const todayLabel = useMemo(() => {
    const date = new Date()
    return date
      .toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      .replace(/^\w/, (c) => c.toUpperCase())
  }, [])

  const activeEmployees = useMemo(
    () =>
      employees
        .filter((item) => item.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [employees],
  )

  const employee = useMemo(() => {
    if (!employeeId) return null
    return employees.find((item) => item.id === employeeId) ?? null
  }, [employeeId, employees])

  useEffect(() => {
    if (!employeeId) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const record = records.find((item) => {
      const recordDate = new Date(item.date)
      recordDate.setHours(0, 0, 0, 0)
      return item.employeeId === employeeId && recordDate.getTime() === today.getTime()
    })

    setTodayRecord(record ?? null)

    if (!record) {
      setKioskMode('check-in')
    } else if (!record.exitTime) {
      setKioskMode('check-out')
    } else {
      setKioskMode('done')
    }
  }, [employeeId, records])

  useEffect(() => {
    entrySignaturePadRef.current?.clear()
    exitSignaturePadRef.current?.clear()
  }, [employeeId, kioskMode])

  const handleSelectEmployee = () => {
    if (!selectedEmployeeId) {
      setMessageType('error')
      setMessage('Selecciona un empleado')
      return
    }

    const found = employees.find((item) => item.id === selectedEmployeeId)

    if (!found) {
      setMessageType('error')
      setMessage('Empleado no encontrado')
      setEmployeeId(null)
      return
    }

    if (found.status !== 'active') {
      setMessageType('error')
      setMessage('Este empleado está inactivo')
      setEmployeeId(null)
      return
    }

    setEmployeeId(found.id)
    setMessage('')
  }

  const getTimeString = () =>
    new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const handleMarkEntry = () => {
    if (!employee) return

    if (entrySignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de marcar entrada')
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingRecord = records.find((item) => {
      const recordDate = new Date(item.date)
      recordDate.setHours(0, 0, 0, 0)
      return item.employeeId === employee.id && recordDate.getTime() === today.getTime()
    })

    if (existingRecord?.entryTime) {
      setMessageType('error')
      setMessage('Ya marcaste entrada hoy')
      return
    }

    const timeStr = getTimeString()
    const entrySignature = entrySignaturePadRef.current?.toDataURL('image/png') ?? ''
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      date: new Date(),
      entryTime: timeStr,
      exitTime: '',
      hoursWorked: 0,
      dailySalary: 0,
      entrySignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(newRecord)
        setRecords((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
        setTodayRecord(saved)
        setKioskMode('check-out')
        setMessageType('success')
        setMessage('Entrada marcada correctamente')
        entrySignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 2000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo registrar la entrada')
      }
    })
  }

  const handleMarkExit = () => {
    if (!employee || !todayRecord || !todayRecord.entryTime) {
      setMessageType('error')
      setMessage('Primero debes marcar entrada')
      return
    }

    if (exitSignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de marcar salida')
      return
    }

    if (todayRecord.exitTime) {
      setMessageType('error')
      setMessage('Ya marcaste salida hoy')
      return
    }

    const timeStr = getTimeString()
    const hoursWorked = calculateHoursWorked(todayRecord.entryTime, timeStr)
    const dailySalary = calculateDailySalary(hoursWorked, employee.hourlyRate)
    const exitSignature = exitSignaturePadRef.current?.toDataURL('image/png') ?? ''

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      exitTime: timeStr,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      dailySalary: Math.round(dailySalary * 100) / 100,
      exitSignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(updatedRecord)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
        setTodayRecord(saved)
        setKioskMode('done')
        setMessageType('success')
        setMessage('Salida marcada correctamente')
        exitSignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 2000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo registrar la salida')
      }
    })
  }

  const missingEntrySignature = Boolean(
    todayRecord?.entryTime && !todayRecord.entrySignature,
  )
  const missingExitSignature = Boolean(
    todayRecord?.exitTime && !todayRecord.exitSignature,
  )
  const showEntrySignaturePad = kioskMode === 'check-in' || missingEntrySignature
  const showExitSignaturePad = kioskMode === 'check-out' || missingExitSignature

  const handleSaveEntrySignature = () => {
    if (!employee || !todayRecord) return

    if (entrySignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de guardar')
      return
    }

    const entrySignature = entrySignaturePadRef.current?.toDataURL('image/png') ?? ''
    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      entrySignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(updatedRecord)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
        setTodayRecord(saved)
        setMessageType('success')
        setMessage('Firma de entrada guardada')
        entrySignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 2000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo guardar la firma')
      }
    })
  }

  const handleSaveExitSignature = () => {
    if (!employee || !todayRecord) return

    if (exitSignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de guardar')
      return
    }

    const exitSignature = exitSignaturePadRef.current?.toDataURL('image/png') ?? ''
    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      exitSignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(updatedRecord)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
        setTodayRecord(saved)
        setMessageType('success')
        setMessage('Firma de salida guardada')
        exitSignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 2000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo guardar la firma')
      }
    })
  }

  const handleReset = () => {
    setSelectedEmployeeId('')
    setEmployeeId(null)
    setKioskMode('check-in')
    setMessage('')
    setTodayRecord(null)
    entrySignaturePadRef.current?.clear()
    exitSignaturePadRef.current?.clear()
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-sm bg-primary text-primary-foreground flex items-center justify-center font-bold text-3xl mx-auto mb-4 shadow-md">
            C
          </div>
          <h1 className="text-3xl font-bold text-foreground">Clofi</h1>
          <p className="text-muted-foreground mt-2">Registra tu asistencia</p>
        </div>

        <Card className="p-4 bg-card border-border mb-6 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">{todayLabel}</p>
          <p className="text-3xl font-bold text-foreground font-mono">{currentTime}</p>
        </Card>

        {message && (
          <Card
            className={`p-4 mb-6 flex items-center gap-3 ${messageType === 'success' ? 'bg-primary/10' : 'bg-destructive/10'}`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
            ) : (
              <AlertCircle className="text-destructive flex-shrink-0" size={20} />
            )}
            <p className={messageType === 'success' ? 'text-primary' : 'text-destructive'}>
              {message}
            </p>
          </Card>
        )}

        {!employeeId ? (
          <Card className="p-6 bg-card border-border shadow-sm">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="employee-select"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  <User size={16} className="inline mr-2" />
                  Selecciona tu nombre
                </label>
                {activeEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay empleados activos disponibles.
                  </p>
                ) : (
                  <select
                    id="employee-select"
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-base"
                    autoFocus
                  >
                    <option value="">Elige un empleado...</option>
                    {activeEmployees.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.position}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button
                onClick={handleSelectEmployee}
                disabled={activeEmployees.length === 0}
                className="w-full bg-primary text-primary-foreground py-3 font-semibold text-lg shadow-sm hover:shadow-md"
              >
                Continuar
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card className="p-6 bg-card border-border mb-6 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground text-center">{employee?.name}</h2>
              <p className="text-center text-muted-foreground mt-2">{employee?.position}</p>
            </Card>

            {showEntrySignaturePad && (
              <Card className="p-6 bg-card border-border mb-6 shadow-sm space-y-4">
                <SignaturePad ref={entrySignaturePadRef} label="Firma de entrada" />
                {missingEntrySignature && kioskMode === 'done' && (
                  <Button
                    onClick={handleSaveEntrySignature}
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground py-3 font-semibold"
                  >
                    Guardar firma de entrada
                  </Button>
                )}
              </Card>
            )}

            {showExitSignaturePad && (
              <Card className="p-6 bg-card border-border mb-6 shadow-sm space-y-4">
                <SignaturePad ref={exitSignaturePadRef} label="Firma de salida" />
                {missingExitSignature && kioskMode === 'done' && (
                  <Button
                    onClick={handleSaveExitSignature}
                    disabled={isPending}
                    className="w-full bg-secondary text-secondary-foreground py-3 font-semibold"
                  >
                    Guardar firma de salida
                  </Button>
                )}
              </Card>
            )}

            <div className="space-y-4 mb-6">
              {kioskMode === 'check-in' && (
                <Button
                  onClick={handleMarkEntry}
                  disabled={isPending}
                  className="w-full bg-primary text-primary-foreground py-4 font-bold text-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <LogIn size={24} />
                  Marcar Entrada
                </Button>
              )}

              {kioskMode === 'check-out' && (
                <Button
                  onClick={handleMarkExit}
                  disabled={isPending}
                  className="w-full bg-secondary text-secondary-foreground py-4 font-bold text-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <LogOut size={24} />
                  Marcar Salida
                </Button>
              )}
            </div>

            <Card className="p-6 bg-accent/20 border-border mb-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Estado del día</p>
                <div className="flex items-center justify-center gap-2">
                  {!todayRecord ? (
                    <>
                      <AlertCircle className="text-destructive" size={20} />
                      <p className="text-lg font-semibold text-destructive">Sin entrada registrada</p>
                    </>
                  ) : !todayRecord.exitTime ? (
                    <>
                      <Clock className="text-primary" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-primary">Entrada marcada</p>
                        <p className="text-sm text-muted-foreground">{todayRecord.entryTime}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="text-primary" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-primary">Jornada completada</p>
                        <p className="text-sm text-muted-foreground">
                          {todayRecord.entryTime} - {todayRecord.exitTime}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {todayRecord && (
              <Card className="p-4 bg-muted/20 border-border mb-6 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3">Resumen del día</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrada:</span>
                    <span className="text-foreground font-medium">
                      {todayRecord.entryTime || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salida:</span>
                    <span className="text-foreground font-medium">
                      {todayRecord.exitTime || '—'}
                    </span>
                  </div>
                  {todayRecord.hoursWorked > 0 && (
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Horas:</span>
                      <span className="text-foreground font-semibold">
                        {todayRecord.hoursWorked.toFixed(1)}h
                      </span>
                    </div>
                  )}
                  {(todayRecord.entrySignature || todayRecord.exitSignature) && (
                    <div className="pt-3 border-t border-border space-y-3">
                      {todayRecord.entrySignature && (
                        <div>
                          <p className="text-muted-foreground mb-1">Firma de entrada</p>
                          <img
                            src={todayRecord.entrySignature}
                            alt="Firma de entrada"
                            className="h-16 w-full rounded-sm border border-border bg-background object-contain"
                          />
                        </div>
                      )}
                      {todayRecord.exitSignature && (
                        <div>
                          <p className="text-muted-foreground mb-1">Firma de salida</p>
                          <img
                            src={todayRecord.exitSignature}
                            alt="Firma de salida"
                            className="h-16 w-full rounded-sm border border-border bg-background object-contain"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Cambiar Empleado
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
