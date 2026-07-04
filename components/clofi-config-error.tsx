import { Card } from '@/components/ui/card'

interface ClofiConfigErrorProps {
  message: string
}

export function ClofiConfigError({ message }: ClofiConfigErrorProps) {
  return (
    <Card className="p-8 max-w-2xl mx-auto border-destructive/30 bg-destructive/5">
      <h1 className="text-xl font-bold text-foreground mb-2">Configuración requerida</h1>
      <p className="text-muted-foreground mb-4">{message}</p>
      <div className="rounded-lg bg-muted/40 p-4 text-sm font-mono text-foreground">
        <p># .env.local</p>
        <p>NEXT_PUBLIC_SUPABASE_URL=...</p>
        <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</p>
        <p>SUPABASE_SERVICE_ROLE_KEY=...</p>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Los empleados se leen de la tabla <code className="text-foreground">employees</code>.
      </p>
    </Card>
  )
}
