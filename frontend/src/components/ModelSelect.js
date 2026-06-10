import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, findModel } from "@/data/moneyModels";

export function ModelSelect({ value, onChange, testId = "model-select" }) {
  const selected = findModel(value);
  return (
    <div className="space-y-2">
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger data-testid={testId} className="h-11 focus:ring-black">
          <SelectValue placeholder="Pick a money model" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {CATEGORIES.map((c) => (
            <SelectGroup key={c.key}>
              <SelectLabel className="text-xs uppercase tracking-widest text-neutral-400">
                {c.name}
              </SelectLabel>
              {c.models.map((m) => (
                <SelectItem key={m.key} value={m.key} data-testid={`model-option-${m.key}`}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <p className="text-xs text-neutral-500 leading-relaxed bg-neutral-50 border border-neutral-200 rounded-md p-3">
          {selected.plain}
        </p>
      )}
    </div>
  );
}
