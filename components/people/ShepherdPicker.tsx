import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Input";

const NONE_VALUE = "__none__";

export function ShepherdPicker({
  label = "Shepherd",
  value,
  onChange,
  candidates,
  allowNone = true,
  noneLabel = "No Shepherd / Root",
}: {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  candidates: { id: string; name: string }[];
  allowNone?: boolean;
  noneLabel?: string;
}) {
  const options = [
    ...(allowNone ? [{ value: NONE_VALUE, label: noneLabel }] : []),
    ...candidates.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div>
      <Label>{label}</Label>
      <Select
        value={value ?? NONE_VALUE}
        onValueChange={(v) => onChange(v === NONE_VALUE ? null : v)}
        options={options}
        placeholder={noneLabel}
      />
    </div>
  );
}
