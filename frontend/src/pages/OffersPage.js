import { useEffect, useState } from "react";
import { useBusiness } from "@/context/BusinessContext";
import api from "@/lib/api";
import { fmt, pct, offerMath, simulationMath } from "@/lib/calc";
import { Jargon } from "@/components/Jargon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Save, FolderOpen, X } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

const TYPES = {
  base: { label: "Base offer", hint: "Gets people in the door" },
  core: { label: "Core offer", hint: "Your main thing" },
  upsell: { label: "Upsell", hint: "The next step up" },
};

const newOffer = (type) => ({
  id: uid(),
  type,
  name: "",
  unit: "",
  price: "",
  cost: "",
  unitsPerMonth: "",
});

function OfferCard({ offer, onChange, onRemove }) {
  const m = offerMath(offer);
  const t = TYPES[offer.type] || TYPES.core;
  return (
    <div
      data-testid={`offer-card-${offer.id}`}
      className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="bg-black text-white hover:bg-black rounded-full px-3">{t.label}</Badge>
          <span className="text-xs text-neutral-400">{t.hint}</span>
        </div>
        <button
          data-testid={`remove-offer-${offer.id}`}
          onClick={onRemove}
          className="text-neutral-300 hover:text-black transition-colors duration-200"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">What's it called?</Label>
          <Input
            data-testid={`offer-name-${offer.id}`}
            value={offer.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. 6-Week Kickstart"
            className="focus-visible:ring-black"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">
            What is one <Jargon term="UNIT">unit</Jargon>?
          </Label>
          <Input
            data-testid={`offer-unit-${offer.id}`}
            value={offer.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="e.g. one session, one box"
            className="focus-visible:ring-black"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">Price per unit ($)</Label>
          <Input
            data-testid={`offer-price-${offer.id}`}
            type="number"
            min="0"
            value={offer.price}
            onChange={(e) => onChange({ price: e.target.value })}
            placeholder="100"
            className="focus-visible:ring-black"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-neutral-500">What it costs you to deliver ($)</Label>
          <Input
            data-testid={`offer-cost-${offer.id}`}
            type="number"
            min="0"
            value={offer.cost}
            onChange={(e) => onChange({ cost: e.target.value })}
            placeholder="40"
            className="focus-visible:ring-black"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-neutral-500">Units you expect to sell per month</Label>
          <Input
            data-testid={`offer-units-${offer.id}`}
            type="number"
            min="0"
            value={offer.unitsPerMonth}
            onChange={(e) => onChange({ unitsPerMonth: e.target.value })}
            placeholder="20"
            className="focus-visible:ring-black"
          />
        </div>
      </div>

      <p className="text-sm pt-1 border-t border-neutral-100">
        {m.price > 0 ? (
          <>
            You keep <span className="font-bold">{fmt(m.profitPerUnit)}</span> per unit (
            <Jargon term="MARGIN">{pct(m.margin)} margin</Jargon>)
            {m.units > 0 && (
              <>
                {" "}
                → <span className="font-bold">{fmt(m.monthlyProfit)}</span>/month
              </>
            )}
            {m.profitPerUnit < 0 && (
              <span className="text-red-600 font-medium"> — you lose money on each one.</span>
            )}
          </>
        ) : (
          <span className="text-neutral-400">Fill in price & cost to see your numbers.</span>
        )}
      </p>
    </div>
  );
}

function SimSummary({ offers }) {
  const t = simulationMath(offers);
  return (
    <div
      data-testid="simulation-summary"
      className="bg-black text-white rounded-xl p-6 sm:p-8 space-y-5 lg:sticky lg:top-24"
    >
      <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
        Does this make money?
      </p>
      <p
        data-testid="simulation-verdict"
        className="font-heading font-extrabold text-2xl tracking-tight"
      >
        {t.monthlyRevenue === 0
          ? "Add some numbers ↓"
          : t.profitable
          ? "Yes — this makes money ✓"
          : "Not yet — this loses money"}
      </p>
      <div className="space-y-3 pt-2 border-t border-neutral-800">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Money in / month</span>
          <span className="font-bold">{fmt(t.monthlyRevenue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Costs / month</span>
          <span className="font-bold">{fmt(t.monthlyCost)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">You keep / month</span>
          <span className="font-bold">{fmt(t.monthlyProfit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">
            <Jargon term="MARGIN">Margin</Jargon>
          </span>
          <span className="font-bold">{pct(t.margin)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { current } = useBusiness();
  const [simName, setSimName] = useState("My first plan");
  const [offers, setOffers] = useState([newOffer("core")]);
  const [saved, setSaved] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setOffers([newOffer("core")]);
    setSimName("My first plan");
    setCompareIds([]);
    api
      .get(`/businesses/${current.id}/simulations`)
      .then(({ data }) => setSaved(data))
      .catch(() => setSaved([]));
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const updateOffer = (id, patch) =>
    setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const saveSim = async () => {
    setSaving(true);
    try {
      const { data } = await api.post(`/businesses/${current.id}/simulations`, {
        name: simName.trim() || "Untitled",
        offers,
      });
      setSaved((prev) => [data, ...prev]);
      toast.success("Simulation saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
    setSaving(false);
  };

  const loadSim = (sim) => {
    setSimName(sim.name);
    setOffers(sim.offers.length ? sim.offers : [newOffer("core")]);
    toast.success(`Loaded "${sim.name}"`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSim = async (sim) => {
    try {
      await api.delete(`/simulations/${sim.id}`);
      setSaved((prev) => prev.filter((s) => s.id !== sim.id));
      setCompareIds((prev) => prev.filter((id) => id !== sim.id));
      toast.success("Deleted");
    } catch {
      toast.error("Couldn't delete.");
    }
  };

  const toggleCompare = (id) =>
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)));

  const comparing = saved.filter((s) => compareIds.includes(s.id));

  return (
    <div className="space-y-10">
      <div className="fade-up">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
          Your offers
        </h1>
        <p className="mt-2 text-neutral-500 text-sm sm:text-base max-w-2xl leading-relaxed">
          List what you sell, what one unit costs you, and we'll tell you straight: does it make
          money? Save versions and compare them side by side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up fade-up-1">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <Input
              data-testid="simulation-name-input"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              className="font-bold sm:max-w-xs focus-visible:ring-black"
              placeholder="Name this simulation"
            />
            <Button
              data-testid="save-simulation-button"
              onClick={saveSim}
              disabled={saving}
              className="bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
            >
              <Save size={15} className="mr-2" /> {saving ? "Saving..." : "Save simulation"}
            </Button>
          </div>

          {offers.map((o) => (
            <OfferCard
              key={o.id}
              offer={o}
              onChange={(patch) => updateOffer(o.id, patch)}
              onRemove={() => setOffers((prev) => prev.filter((x) => x.id !== o.id))}
            />
          ))}

          <div className="flex flex-wrap gap-2">
            {Object.entries(TYPES).map(([key, t]) => (
              <Button
                key={key}
                data-testid={`add-offer-${key}`}
                variant="outline"
                onClick={() => setOffers((prev) => [...prev, newOffer(key)])}
                className="border-neutral-300 hover:bg-neutral-50 hover:border-black transition-all duration-200"
              >
                <Plus size={14} className="mr-1.5" /> {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Live summary */}
        <div>
          <SimSummary offers={offers} />
        </div>
      </div>

      {/* Saved + compare */}
      <div className="fade-up fade-up-2">
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
          Saved simulations
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Tick two or three to compare them side by side.
        </p>

        {saved.length === 0 ? (
          <p data-testid="no-saved-simulations" className="mt-4 text-sm text-neutral-400">
            Nothing saved yet — build a plan above and hit "Save simulation".
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((sim) => {
              const t = simulationMath(sim.offers);
              return (
                <div
                  key={sim.id}
                  data-testid={`saved-sim-${sim.id}`}
                  className="bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-sm">{sim.name}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {sim.offers.length} offer{sim.offers.length !== 1 ? "s" : ""} ·{" "}
                        {t.profitable ? "makes money" : "loses money"}
                      </p>
                    </div>
                    <Checkbox
                      data-testid={`compare-checkbox-${sim.id}`}
                      checked={compareIds.includes(sim.id)}
                      onCheckedChange={() => toggleCompare(sim.id)}
                      className="data-[state=checked]:bg-black data-[state=checked]:border-black"
                    />
                  </div>
                  <p className="mt-3 font-heading font-extrabold text-xl tracking-tight">
                    {fmt(t.monthlyProfit)}
                    <span className="text-xs font-body font-normal text-neutral-400"> /month kept</span>
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      data-testid={`load-sim-${sim.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => loadSim(sim)}
                      className="flex-1 border-neutral-300 hover:border-black transition-colors duration-200"
                    >
                      <FolderOpen size={13} className="mr-1.5" /> Open
                    </Button>
                    <Button
                      data-testid={`delete-sim-${sim.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => deleteSim(sim)}
                      className="border-neutral-300 hover:border-red-500 hover:text-red-600 transition-colors duration-200"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {comparing.length >= 2 && (
          <div data-testid="comparison-panel" className="mt-8 overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-lg tracking-tight">Side by side</h3>
              <button
                data-testid="clear-comparison"
                onClick={() => setCompareIds([])}
                className="text-xs text-neutral-400 hover:text-black flex items-center gap-1 transition-colors duration-200"
              >
                <X size={12} /> Clear
              </button>
            </div>
            <table className="w-full min-w-[560px] text-sm border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="text-left p-4 font-medium text-neutral-400 text-xs uppercase tracking-widest">
                    
                  </th>
                  {comparing.map((s) => (
                    <th key={s.id} className="text-left p-4 font-heading font-bold">
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Offers", (t, s) => `${s.offers.length}`],
                  ["Money in / month", (t) => fmt(t.monthlyRevenue)],
                  ["Costs / month", (t) => fmt(t.monthlyCost)],
                  ["You keep / month", (t) => fmt(t.monthlyProfit)],
                  ["Margin", (t) => pct(t.margin)],
                  ["Verdict", (t) => (t.profitable ? "Makes money ✓" : "Loses money ✗")],
                ].map(([label, fn]) => (
                  <tr key={label} className="border-t border-neutral-200">
                    <td className="p-4 text-neutral-500">{label}</td>
                    {comparing.map((s) => {
                      const t = simulationMath(s.offers);
                      return (
                        <td key={s.id} className="p-4 font-medium">
                          {fn(t, s)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
