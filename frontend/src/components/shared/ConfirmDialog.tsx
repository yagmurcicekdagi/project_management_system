import { createPortal } from 'react-dom'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card'
import { Button } from '../ui/button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-neutral-950/60 p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{description}</p>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>,
    document.body,
  )
}
