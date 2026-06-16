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
        <p>CLOFI_ORGANIZATION_ID=tu-uuid-de-organizations</p>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Obtén el UUID en Supabase → Table Editor →{' '}
        <code className="text-foreground">organizations</code>.
      </p>
    </Card>
  )
}
