'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface DeleteConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-md w-full border border-border">
        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
              <p className="text-muted-foreground mt-2 text-sm">{message}</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 border-t border-border">
          <Button
            onClick={onCancel}
            className="flex-1 bg-accent text-accent-foreground hover:bg-accent/80"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}
