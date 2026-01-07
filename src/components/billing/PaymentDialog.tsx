'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useUserStore } from '@/lib/store/user'

interface PaymentDialogProps {
    onSuccess: () => void
}

export function PaymentDialog({ onSuccess }: PaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const { profile } = useUserStore()
    const supabase = createClient()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount || !file || !profile) {
            toast.error('Please fill in all fields')
            return
        }

        setLoading(true)

        try {
            // 1. Upload proof
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}/${uuidv4()}.${fileExt}`
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment-proofs')
                .upload(fileName, file)

            if (uploadError) throw uploadError

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('payment-proofs')
                .getPublicUrl(fileName)

            // 2. Create payment record
            // Note: Schema might require 'payment_date' or default it. Usually 'created_at' is auto.
            // We set status to 'pending'
            const { error: insertError } = await supabase
                .from('payments')
                .insert({
                    user_id: profile.id,
                    amount: parseFloat(amount),
                    status: 'pending',
                    proof_url: publicUrl,
                    payment_date: new Date().toISOString() // Assuming payment date is now
                })

            if (insertError) throw insertError

            toast.success('Payment submitted for review!')
            setOpen(false)
            setAmount('')
            setFile(null)
            onSuccess()

        } catch (error: any) {
            console.error('Payment submission error:', error)
            toast.error(error.message || 'Failed to submit payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Make Payment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Make a Payment</DialogTitle>
                    <DialogDescription>
                        Transfer to the account below and upload your proof.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
                        <p className="text-sm font-medium">Bank Transfer Details</p>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            <p><strong>Bank:</strong> BCA</p>
                            <p><strong>Account:</strong> 123-456-7890</p>
                            <p><strong>Name:</strong> ISP Nexus Corp</p>
                        </div>
                    </div>
                    <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (IDR)</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="proof">Payment Proof</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="proof"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                    className="cursor-pointer"
                                />
                            </div>
                            <p className="text-[0.8rem] text-muted-foreground">
                                Upload a screenshot or photo of your transfer.
                            </p>
                        </div>
                    </form>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" form="payment-form" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
