import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { Deposit } from '@/lib/api'
import { useDeleteDeposit } from '../hooks'

interface DeleteDepositDialogProps {
  deposit: Deposit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteDepositDialog({
  deposit,
  open,
  onOpenChange,
}: DeleteDepositDialogProps) {
  const deleteDeposit = useDeleteDeposit()

  if (!deposit) return null

  const handleDelete = async () => {
    try {
      await deleteDeposit.mutateAsync(deposit.id)
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить депозит?</AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить депозит <strong>"{deposit.assetName}"</strong>?
            Это действие нельзя отменить. Вся история начислений также будет удалена.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDeposit.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteDeposit.isPending ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
