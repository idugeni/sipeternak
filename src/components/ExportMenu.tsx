import { Download, FileSpreadsheet, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExportFormat } from "@/lib/export";

export function ExportMenu({
  onExport,
  disabled,
  label = "Export",
}: {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[#dfe5e1]"
          disabled={disabled}
          aria-label={label}
        >
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Dokumen enterprise</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onExport("excel")}>
          <FileSpreadsheet />
          Excel (.xls)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport("csv")}>
          <FileText />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport("pdf")}>
          <Printer />
          PDF / Cetak
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
