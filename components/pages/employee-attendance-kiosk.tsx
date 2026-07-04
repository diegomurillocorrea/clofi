'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { AttendanceRecord, Employee } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignaturePad, type SignaturePadHandle } from '@/components/signature-pad'
import {
  calculateDailySalary,
  calculateHoursWorked,
  getCurrentTimeHHmm,
  getLocalDateKey,
  isOpenAttendanceShift,
  isSameLocalDay,
} from '@/lib/utils-custom'
import { Clock, PenLine, CheckCircle2, AlertCircle, User, Plus, LogOut } from 'lucide-react'
import { saveAttendanceRecordAction } from '@/app/actions/clofi'
import { createClient } from '@/lib/supabase/client'

type KioskMode = 'check-in' | 'check-out' | 'done'

interface EmployeeAttendanceKioskProps {
  employees: Employee[]
  initialRecords: AttendanceRecord[]
  /** When set, the kiosk is locked to this employee (logged-in Vendedor). */
  sessionEmployee?: Employee | null
}

export function EmployeeAttendanceKiosk({
  employees,
  initialRecords,
  sessionEmployee = null,
}: EmployeeAttendanceKioskProps) {
  const isLockedToSession = Boolean(sessionEmployee)
  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeId, setEmployeeId] = useState<string | null>(
    sessionEmployee?.id ?? null,
  )
  const [kioskMode, setKioskMode] = useState<KioskMode>('check-in')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [wantsNewShift, setWantsNewShift] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [sessionEmail, setSessionEmail] = useState<string | null>(
    sessionEmployee?.email ?? null,
  )
  const [isSigningOut, setIsSigningOut] = useState(false)
  const entrySignaturePadRef = useRef<SignaturePadHandle>(null)
  const exitSignaturePadRef = useRef<SignaturePadHandle>(null)
  const exitPadRecordIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (sessionEmployee) {
      setEmployeeId(sessionEmployee.id)
      setSessionEmail(sessionEmployee.email ?? null)
      return
    }

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionEmail(user?.email ?? null)
    })
  }, [sessionEmployee])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
    if (sessionEmployee?.id === employeeId) return sessionEmployee
    return employees.find((item) => item.id === employeeId) ?? null
  }, [employeeId, employees, sessionEmployee])

  const todayRecords = useMemo(() => {
    if (!employeeId) return []

    const today = new Date()

    return records
      .filter(
        (item) =>
          item.employeeId === employeeId && isSameLocalDay(new Date(item.date), today),
      )
      .sort((a, b) => a.entryTime.localeCompare(b.entryTime))
  }, [employeeId, records])

  const activeRecord = useMemo(
    () => todayRecords.find((item) => isOpenAttendanceShift(item)) ?? null,
    [todayRecords],
  )

  const completedTodayRecords = useMemo(
    () => todayRecords.filter((item) => !isOpenAttendanceShift(item) && item.exitTime?.trim()),
    [todayRecords],
  )

  useEffect(() => {
    if (!employeeId) return

    if (activeRecord) {
      setKioskMode('check-out')
      setWantsNewShift(false)
    } else if (completedTodayRecords.length > 0 && !wantsNewShift) {
      setKioskMode('done')
    } else {
      setKioskMode('check-in')
    }
  }, [employeeId, activeRecord?.id, completedTodayRecords.length, wantsNewShift])

  useEffect(() => {
    entrySignaturePadRef.current?.clear()
    exitPadRecordIdRef.current = null
  }, [employeeId])

  useEffect(() => {
    const openId = activeRecord?.id ?? null
    if (kioskMode === 'check-out' && openId && openId !== exitPadRecordIdRef.current) {
      exitSignaturePadRef.current?.clear()
      exitPadRecordIdRef.current = openId
    }
    if (kioskMode !== 'check-out') {
      exitPadRecordIdRef.current = null
    }
  }, [kioskMode, activeRecord?.id])

  const findOpenRecordForEmployee = () => {
    if (!employeeId) return null

    const today = new Date()
    return (
      records
        .filter(
          (item) =>
            item.employeeId === employeeId && isSameLocalDay(new Date(item.date), today),
        )
        .find(isOpenAttendanceShift) ?? null
    )
  }

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
    setWantsNewShift(false)
    setMessage('')
  }

  const handleStartNewShift = () => {
    if (activeRecord) return
    setWantsNewShift(true)
    setKioskMode('check-in')
    setMessage('')
    entrySignaturePadRef.current?.clear()
    exitSignaturePadRef.current?.clear()
  }

  const handleMarkEntry = () => {
    if (!employee) return

    if (entrySignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar para registrar tu entrada')
      return
    }

    if (activeRecord) {
      setMessageType('error')
      setMessage('Ya tienes una jornada en curso. Marca salida primero.')
      return
    }

    const timeStr = getCurrentTimeHHmm()
    const entrySignature = entrySignaturePadRef.current?.toDataURL('image/png') ?? ''
    const newRecord: AttendanceRecord = {
      id: crypto.randomUUID(),
      employeeId: employee.id,
      date: new Date(getLocalDateKey(new Date()) + 'T12:00:00'),
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
        setWantsNewShift(false)
        setKioskMode('check-out')
        setMessageType('success')
        setMessage('Entrada registrada correctamente')
        entrySignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 2000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo registrar la entrada')
      }
    })
  }

  const handleMarkExit = () => {
    const openRecord = activeRecord ?? findOpenRecordForEmployee()

    if (!employee || !openRecord || !openRecord.entryTime) {
      setMessageType('error')
      setMessage('Primero debes marcar entrada')
      return
    }

    if (exitSignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar para registrar tu salida')
      return
    }

    const timeStr = getCurrentTimeHHmm()
    const hoursWorked = calculateHoursWorked(openRecord.entryTime, timeStr)
    const dailySalary = calculateDailySalary(hoursWorked, employee.hourlyRate)
    const exitSignature = exitSignaturePadRef.current?.toDataURL('image/png') ?? ''

    const updatedRecord: AttendanceRecord = {
      ...openRecord,
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
        setWantsNewShift(false)
        setKioskMode('done')
        setMessageType('success')
        setMessage('Salida registrada correctamente')
        exitSignaturePadRef.current?.clear()
        setTimeout(() => setMessage(''), 4000)
      } catch {
        setMessageType('error')
        setMessage('No se pudo registrar la salida')
      }
    })
  }

  const missingEntrySignature = Boolean(
    activeRecord?.entryTime && !activeRecord.entrySignature,
  )
  const missingExitSignature = Boolean(
    activeRecord?.exitTime && !activeRecord.exitSignature,
  )
  const showEntrySignaturePad = kioskMode === 'check-in' || missingEntrySignature
  const showExitSignaturePad =
    Boolean(activeRecord) || kioskMode === 'check-out' || missingExitSignature

  const handleSaveEntrySignature = () => {
    if (!employee || !activeRecord) return

    if (entrySignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de guardar')
      return
    }

    const entrySignature = entrySignaturePadRef.current?.toDataURL('image/png') ?? ''
    const updatedRecord: AttendanceRecord = {
      ...activeRecord,
      entrySignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(updatedRecord)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
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
    if (!employee || !activeRecord) return

    if (exitSignaturePadRef.current?.isEmpty()) {
      setMessageType('error')
      setMessage('Debes firmar antes de guardar')
      return
    }

    const exitSignature = exitSignaturePadRef.current?.toDataURL('image/png') ?? ''
    const updatedRecord: AttendanceRecord = {
      ...activeRecord,
      exitSignature,
    }

    startTransition(async () => {
      try {
        const saved = await saveAttendanceRecordAction(updatedRecord)
        setRecords((current) =>
          current.map((item) => (item.id === saved.id ? saved : item)),
        )
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
    if (isLockedToSession) {
      return
    }
    setSelectedEmployeeId('')
    setEmployeeId(null)
    setKioskMode('check-in')
    setWantsNewShift(false)
    setMessage('')
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
          <p className="text-base font-medium text-foreground">{todayLabel}</p>
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

        {sessionEmail && !sessionEmployee ? (
          <Card className="p-6 bg-destructive/10 border-destructive/30 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-destructive shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-destructive">Cuenta no vinculada</p>
                <p className="text-sm text-muted-foreground mt-1">
                  No hay un empleado activo con el correo {sessionEmail}. Contacta a un
                  administrador.
                </p>
              </div>
            </div>
          </Card>
        ) : null}

        {!employeeId && !isLockedToSession ? (
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
        ) : employeeId ? (
          <>
            <Card className="p-6 bg-card border-border mb-6 shadow-sm">
              <h2 className="text-2xl font-bold text-foreground text-center">{employee?.name}</h2>
              <p className="text-center text-muted-foreground mt-2">{employee?.position}</p>
            </Card>

            <Card className="p-6 bg-accent/20 border-border mb-6 shadow-sm">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Estado del día</p>
                <div className="flex items-center justify-center gap-2">
                  {activeRecord ? (
                    <>
                      <Clock className="text-primary" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-primary">Jornada en curso</p>
                        {completedTodayRecords.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {completedTodayRecords.length} jornada(s) previa(s) registrada(s)
                          </p>
                        )}
                      </div>
                    </>
                  ) : kioskMode === 'done' ? (
                    <>
                      <CheckCircle2 className="text-primary" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-primary">
                          {completedTodayRecords.length === 1
                            ? 'Jornada completada'
                            : `${completedTodayRecords.length} jornadas completadas`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Tu asistencia quedó registrada
                        </p>
                      </div>
                    </>
                  ) : completedTodayRecords.length > 0 ? (
                    <>
                      <Plus className="text-primary" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-primary">Nueva jornada</p>
                        <p className="text-sm text-muted-foreground">
                          Firma abajo para registrar otro turno
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="text-destructive" size={20} />
                      <div>
                        <p className="text-lg font-semibold text-destructive">Sin entrada registrada</p>
                        <p className="text-sm text-muted-foreground">
                          Firma abajo para iniciar tu jornada
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>

            {showEntrySignaturePad && (
              <Card className="p-6 bg-card border-border mb-6 shadow-sm space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Firma para registrar tu entrada
                </p>
                <SignaturePad ref={entrySignaturePadRef} label="Firma de entrada" />
                {missingEntrySignature && kioskMode === 'done' ? (
                  <Button
                    onClick={handleSaveEntrySignature}
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground py-3 font-semibold"
                  >
                    Guardar firma de entrada
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkEntry}
                    disabled={isPending}
                    className="w-full bg-primary text-primary-foreground py-4 font-bold text-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <PenLine size={24} />
                    Firmar entrada
                  </Button>
                )}
              </Card>
            )}

            {showExitSignaturePad && (
              <Card className="p-6 bg-card border-border mb-6 shadow-sm space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Firma para registrar tu salida
                </p>
                <SignaturePad ref={exitSignaturePadRef} label="Firma de salida" />
                {missingExitSignature && kioskMode === 'done' ? (
                  <Button
                    onClick={handleSaveExitSignature}
                    disabled={isPending}
                    className="w-full bg-secondary text-secondary-foreground py-3 font-semibold"
                  >
                    Guardar firma de salida
                  </Button>
                ) : (
                  <Button
                    onClick={handleMarkExit}
                    disabled={isPending}
                    className="w-full bg-secondary text-secondary-foreground py-4 font-bold text-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <PenLine size={24} />
                    Firmar salida
                  </Button>
                )}
              </Card>
            )}

            {todayRecords.length > 0 && (
              <Card className="p-4 bg-muted/20 border-border mb-6 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Registro del día
                  {completedTodayRecords.length > 1 &&
                    ` · ${completedTodayRecords.length} jornadas`}
                </h3>
                <div className="space-y-4 text-sm">
                  {completedTodayRecords.map((record, index) => (
                    <div
                      key={record.id}
                      className={index > 0 ? 'pt-4 border-t border-border space-y-3' : 'space-y-3'}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary shrink-0" size={16} />
                        <p className="font-medium text-foreground">
                          {completedTodayRecords.length > 1
                            ? `Jornada ${index + 1} completada`
                            : 'Jornada completada'}
                        </p>
                      </div>
                      {(record.entrySignature || record.exitSignature) && (
                        <div className="space-y-3">
                          {record.entrySignature && (
                            <div>
                              <p className="text-muted-foreground mb-1">Firma de entrada</p>
                              <img
                                src={record.entrySignature}
                                alt={`Firma de entrada jornada ${index + 1}`}
                                className="h-16 w-full rounded-sm border border-border bg-background object-contain"
                              />
                            </div>
                          )}
                          {record.exitSignature && (
                            <div>
                              <p className="text-muted-foreground mb-1">Firma de salida</p>
                              <img
                                src={record.exitSignature}
                                alt={`Firma de salida jornada ${index + 1}`}
                                className="h-16 w-full rounded-sm border border-border bg-background object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {activeRecord && (
                    <div
                      className={
                        completedTodayRecords.length > 0
                          ? 'pt-4 border-t border-border space-y-2'
                          : 'space-y-2'
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="text-primary shrink-0" size={16} />
                        <p className="font-medium text-primary">Jornada en curso</p>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Pendiente de firmar salida
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {kioskMode === 'done' && !activeRecord && (
              <Button
                onClick={handleStartNewShift}
                className="w-full bg-primary text-primary-foreground py-4 font-bold text-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 mb-6"
              >
                <Plus size={22} />
                Registrar otra jornada
              </Button>
            )}

            {!isLockedToSession ? (
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full border-border text-foreground hover:bg-muted"
              >
                Cambiar Empleado
              </Button>
            ) : null}
          </>
        ) : null}

        {sessionEmail ? (
          <div className="mt-8 space-y-3 text-center">
            <p className="truncate text-xs text-muted-foreground" title={sessionEmail}>
              {sessionEmail}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={16} />
              {isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
