"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import * as XLSX from "xlsx"

interface ExcelExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  sheetName?: string
  label?: string
  className?: string
  disabled?: boolean
}

export function ExcelExportButton({
  data,
  filename,
  sheetName = "Report",
  label = "Export to Excel",
  className,
  disabled = false,
}: ExcelExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const finalName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
    XLSX.writeFile(workbook, finalName)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      className={`gap-1.5 font-medium text-xs text-slate-700 hover:text-slate-900 border-slate-300 ${className || ""}`}
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
