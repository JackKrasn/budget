import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUpdateDeposit } from '../hooks'
import type { Deposit } from '@/lib/api'

const formSchema = z.object({
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditDepositDialogProps {
  deposit: Deposit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDepositDialog({
  deposit,
  open,
  onOpenChange,
}: EditDepositDialogProps) {
  const updateDeposit = useUpdateDeposit()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: '',
    },
  })

  useEffect(() => {
    if (deposit) {
      form.reset({
        notes: deposit.notes || '',
      })
    }
  }, [deposit, form])

  async function onSubmit(values: FormValues) {
    if (!deposit) return

    setIsSubmitting(true)
    try {
      await updateDeposit.mutateAsync({
        id: deposit.id,
        data: {
          notes: values.notes || undefined,
        },
      })
      onOpenChange(false)
    } catch {
      // Error is handled in mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Редактировать депозит</DialogTitle>
              <DialogDescription>
                {deposit?.assetName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg bg-muted/50 p-4 text-sm">
              <p className="text-muted-foreground">
                Основные параметры депозита (сумма, ставка, срок) не могут быть изменены после создания.
                Вы можете обновить только заметки.
              </p>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Заметки</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Название банка, условия и т.д."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
