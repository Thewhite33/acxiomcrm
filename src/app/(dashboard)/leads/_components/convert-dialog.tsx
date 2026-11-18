"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserCheck, Loader2 } from "lucide-react"

interface ConvertDialogProps {
  leadId: string
  leadName: string
  expectedValue?: number | null
}

export function ConvertLeadButton({ leadId, leadName, expectedValue }: ConvertDialogProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [createOpportunity, setCreateOpportunity] = useState(true)
  const [dealAmount, setDealAmount] = useState<number | string>(expectedValue || 5000)
  const [opportunityName, setOpportunityName] = useState(`${leadName} - Deal`)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConvert = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createOpportunity,
          dealAmount: createOpportunity ? Number(dealAmount) : 0,
          opportunityName: createOpportunity ? opportunityName : undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to convert lead")
      }

      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An error occurred during conversion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
      >
        <UserCheck className="h-4 w-4 mr-1.5" /> Convert to Customer
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Convert Lead to Customer</h3>
              <p className="text-xs text-slate-500 mt-1">
                This will convert <span className="font-semibold text-slate-800">{leadName}</span> into an active customer account.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={createOpportunity}
                  onChange={(e) => setCreateOpportunity(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                Also create an Opportunity deal
              </label>

              {createOpportunity && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Deal Name</label>
                    <input
                      type="text"
                      value={opportunityName}
                      onChange={(e) => setOpportunityName(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Deal Value ($)</label>
                    <input
                      type="number"
                      value={dealAmount}
                      onChange={(e) => setDealAmount(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleConvert}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Converting...
                  </>
                ) : (
                  "Confirm & Convert"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
