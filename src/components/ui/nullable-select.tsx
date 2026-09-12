import type { ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix SelectItem menolak value string kosong, jadi satu sentinel privat
// dipakai bolak-balik di dalam komponen ini saja. Pemakai tetap bekerja
// dengan string biasa: "" berarti "belum dipilih" (disimpan ke DB sebagai
// null oleh pemanggil).
const EMPTY_VALUE = "__empty";

type NullableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  emptyLabel: string;
  placeholder?: string;
  triggerId?: string;
  triggerClassName?: string;
  children: ReactNode;
};

export function NullableSelect({
  value,
  onValueChange,
  emptyLabel,
  placeholder,
  triggerId,
  triggerClassName = "h-10 w-full border-[#dfe5e1] bg-white text-sm",
  children,
}: NullableSelectProps) {
  return (
    <Select
      value={value === "" ? EMPTY_VALUE : value}
      onValueChange={next => onValueChange(next === EMPTY_VALUE ? "" : next)}
    >
      <SelectTrigger id={triggerId} className={triggerClassName}>
        <SelectValue placeholder={placeholder ?? emptyLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}
