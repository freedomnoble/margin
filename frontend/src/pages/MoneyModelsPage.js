import { useEffect, useState } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { fmt, modelMetrics } from "@/lib/calc";
import { Jargon } from "@/components/Jargon";
import { CATEGORIES, findModel } from "@/data/moneyModels";
import { ModelSelect } from "@/components/ModelSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyStep = (modelKey = "") => ({
  id: uid(),
  modelKey,
  offerName: "",
  price: "",
  cost: "",
  takeRate: 50,
  whenText: "",
  whenDays: 0,
  recurring: false,
});

function StepDialog({ open, onOpenChange, initial, onSave }) {
  const [step, setStep] = useState(initial || emptyStep());

  useEffect(() => {
    if (open) setStep(initial || emptyStep());
  }, [open, initial]);

  const set = (patch) => setStep((s) => ({ ...s, ...patch }));
  const valid = step.modelKey && step.offerName.trim() && Number(step.price) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {initial?.offerName ? "Edit this offer" : "Add an offer to your model"}
          </DialogTitle>
          <DialogDescription>
            Pick a play, name your offer, and tell us when you'll make it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">Which money model?</Label>
            <ModelSelect value={step.modelKey} onChange={(v) => set({ modelKey: v })} testId="step-model-select" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">What's the offer called?</Label>
            <Input
              data-testid="step-offer-name-input"
              value={step.offerName}
              onChange={(e) => set({ offerName: e.target.value })}
              placeholder="e.g. 6-Week Challenge"
              className="focus-visible:ring-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Price ($)</Label>
              <Input
                data-testid="step-price-input"
                type="number"
                min="0"
                value={step.price}
                onChange={(e) => set({ price: e.target.value })}
                placeholder="500"
                className="focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Costs you to deliver ($)</Label>
              <Input
                data-testid="step-cost-input"
                type="number"
                min="0"
                value={step.cost}
                onChange={(e) => set({ cost: e.target.value })}
                placeholder="100"
                className="focus-visible:ring-black"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">
              Out of every 100 customers, how many say yes? (
              <Jargon term="TAKERATE">take rate</Jargon>)
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                data-testid="step-takerate-slider"
                value={[Number(step.takeRate) || 0]}
                onValueChange={([v]) => set({ takeRate: v })}
                min={0}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="font-bold text-sm w-14 text-right">{step.takeRate}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">WHEN do you offer it?</Label>
              <Input
                data-testid="step-when-text-input"
                value={step.whenText}
                onChange={(e) => set({ whenText: e.target.value })}
                placeholder="e.g. Right after first purchase"
                className="focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Days after they become a customer</Label>
              <Input
                data-testid="step-when-days-input"
                type="number"
                min="0"
                value={step.whenDays}
                onChange={(e) => set({ whenDays: e.target.value })}
                placeholder="0 = same day"
                className="focus-visible:ring-black"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-neutral-50 border border-neutral-200 rounded-md p-4">
            <div>
              <p className="text-sm font-medium">They pay this every month</p>
              <p className="text-xs text-neutral-400">Turn on for memberships & subscriptions</p>
            </div>
            <Switch
              data-testid="step-recurring-switch"
              checked={!!step.recurring}
              onCheckedChange={(v) => set({ recurring: v })}
              className="data-[state=checked]:bg-black"
            />
          </div>

          <Button
            data-testid="step-save-button"
            disabled={!valid}
            onClick={() => {
              onSave(step);
              onOpenChange(false);
            }}
            className="w-full h-11 bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
          >
            {initial?.offerName ? "Update offer" : "Add to my model"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MoneyModelsPage() {
  const { current, updateBusiness } = useBusiness();
  const [steps, setSteps] = useState([]);
  const [x, setX] = useState(100);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // step or null
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setSteps(current.money_model?.steps || []);
    setX(current.money_model?.x_customers ?? 100);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const m = modelMetrics(steps, x);

  const saveModel = async (nextSteps = steps, nextX = x) => {
    setSaving(true);
    try {
      await updateBusiness({ money_model: { steps: nextSteps, x_customers: Number(nextX) || 0 } });
      toast.success("Money model saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
    setSaving(false);
  };

  const upsertStep = (step) => {
    setSteps((prev) => {
      const exists = prev.some((s) => s.id === step.id);
      return exists ? prev.map((s) => (s.id === step.id ? step : s)) : [...prev, step];
    });
  };

  const move = (i, dir) => {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const openAdd = (modelKey = "") => {
    setEditing(modelKey ? emptyStepWith(modelKey) : null);
    setDialogOpen(true);
  };

  function emptyStepWith(modelKey) {
    const model = findModel(modelKey);
    return { ...emptyStep(modelKey), whenText: model?.when || "" };
  }

  return (
    <div className="space-y-10">
      <div className="fade-up">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
          Money models
        </h1>
        <p className="mt-2 text-neutral-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          These are battle-tested plays (from Alex Hormozi's $100M Money Models) to earn more from
          every customer. Chain a few together, say when you'll offer each, and watch your{" "}
          <Jargon term="LTV">LTV</Jargon> and <Jargon term="CAC">target CAC</Jargon> appear.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up fade-up-1">
        {/* Your model */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-xl tracking-tight">Your money model</h2>
            <div className="flex gap-2">
              <Button
                data-testid="add-step-button"
                onClick={() => openAdd()}
                variant="outline"
                className="border-neutral-300 hover:border-black transition-colors duration-200"
              >
                <Plus size={14} className="mr-1.5" /> Add offer
              </Button>
              <Button
                data-testid="save-model-button"
                onClick={() => saveModel()}
                disabled={saving}
                className="bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
              >
                <Save size={14} className="mr-1.5" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {steps.length === 0 ? (
            <div
              data-testid="empty-model-state"
              className="border border-dashed border-neutral-300 rounded-lg p-10 text-center"
            >
              <p className="font-heading font-bold text-lg">No offers in your model yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Browse the plays below and hit "Use this model" — or add your own offer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((s, i) => {
                const model = findModel(s.modelKey);
                return (
                  <div
                    key={s.id}
                    data-testid={`model-step-${i}`}
                    className="flex gap-4 bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          data-testid={`step-move-up-${i}`}
                          onClick={() => move(i, -1)}
                          className="text-neutral-300 hover:text-black transition-colors duration-200"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          data-testid={`step-move-down-${i}`}
                          onClick={() => move(i, 1)}
                          className="text-neutral-300 hover:text-black transition-colors duration-200"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-sm">{s.offerName}</p>
                        <Badge variant="outline" className="rounded-full border-neutral-300 text-xs">
                          {model?.name || "Custom"}
                        </Badge>
                        {s.recurring && (
                          <Badge className="bg-black text-white hover:bg-black rounded-full text-xs">
                            monthly
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-neutral-500">
                        {fmt(s.price)}
                        {s.recurring ? "/mo" : ""} · {s.takeRate} in 100 say yes ·{" "}
                        {s.whenText || `day ${s.whenDays || 0}`}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        data-testid={`edit-step-${i}`}
                        onClick={() => {
                          setEditing(s);
                          setDialogOpen(true);
                        }}
                        className="text-neutral-300 hover:text-black transition-colors duration-200"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        data-testid={`delete-step-${i}`}
                        onClick={() => setSteps((prev) => prev.filter((p) => p.id !== s.id))}
                        className="text-neutral-300 hover:text-red-600 transition-colors duration-200"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div
            data-testid="model-results-panel"
            className="bg-black text-white rounded-xl p-6 sm:p-8 space-y-5 lg:sticky lg:top-24"
          >
            <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
              From one customer
            </p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Money in (30 days)</span>
                <span data-testid="result-30day-revenue" className="font-bold">
                  {fmt(m.day30Revenue)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">
                  <Jargon term="GP">Profit</Jargon> (30 days)
                </span>
                <span data-testid="result-30day-gp" className="font-bold">
                  {fmt(m.day30GP)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">
                  <Jargon term="LTV">LTV</Jargon> (12 months)
                </span>
                <span data-testid="result-ltv" className="font-bold">
                  {fmt(m.ltvGP)}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
                Getting a customer (<Jargon term="CAC">CAC</Jargon>)
              </p>
              <p data-testid="result-target-cac" className="mt-2 font-heading font-extrabold text-2xl tracking-tight">
                {fmt(m.healthyCAC)}
              </p>
              <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                A healthy target: spend less than this per customer. Want your money back within 30
                days? Stay under {fmt(m.maxCAC)}.
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-800 space-y-3">
              <Label className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
                With how many customers?
              </Label>
              <Input
                data-testid="model-x-customers-input"
                type="number"
                min="0"
                value={x}
                onChange={(e) => setX(Math.max(0, Number(e.target.value)))}
                className="bg-neutral-900 border-neutral-700 text-white h-11 font-bold focus-visible:ring-white"
              />
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">30-day money in</span>
                <span data-testid="result-total-revenue-30" className="font-bold">
                  {fmt(m.totals.revenue30)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">30-day profit</span>
                <span data-testid="result-total-gp-30" className="font-bold">
                  {fmt(m.totals.gp30)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">12-month profit</span>
                <span data-testid="result-total-ltv" className="font-bold">
                  {fmt(m.totals.ltvGP)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="fade-up fade-up-2">
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
          The playbook
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every model explained like you're five. Tap one to use it.
        </p>
        <Tabs defaultValue="attraction" className="mt-5">
          <TabsList className="bg-neutral-100 h-auto flex-wrap justify-start">
            {CATEGORIES.map((c) => (
              <TabsTrigger
                key={c.key}
                value={c.key}
                data-testid={`catalog-tab-${c.key}`}
                className="data-[state=active]:bg-black data-[state=active]:text-white text-xs sm:text-sm"
              >
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.key} value={c.key} className="mt-5">
              <p className="text-sm text-neutral-500 mb-4">{c.subtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {c.models.map((model) => (
                  <div
                    key={model.key}
                    data-testid={`catalog-card-${model.key}`}
                    className="bg-white border border-neutral-200 rounded-lg p-6 flex flex-col hover:border-black hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] transition-all duration-300"
                  >
                    <h3 className="font-heading font-bold text-base tracking-tight">{model.name}</h3>
                    <p className="mt-2 text-sm text-neutral-500 leading-relaxed flex-1">
                      {model.plain}
                    </p>
                    <p className="mt-3 text-xs text-neutral-400 italic leading-relaxed">
                      {model.example}
                    </p>
                    <p className="mt-3 text-xs">
                      <span className="font-bold uppercase tracking-widest text-[10px]">When:</span>{" "}
                      <span className="text-neutral-500">{model.when}</span>
                    </p>
                    <Button
                      data-testid={`use-model-${model.key}`}
                      onClick={() => openAdd(model.key)}
                      variant="outline"
                      size="sm"
                      className="mt-4 border-neutral-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                    >
                      <Plus size={13} className="mr-1.5" /> Use this model
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <StepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={upsertStep}
      />
    </div>
  );
}
