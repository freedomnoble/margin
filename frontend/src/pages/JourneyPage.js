import { useEffect, useState } from "react";
import { useBusiness } from "@/context/BusinessContext";
import { fmt } from "@/lib/calc";
import { Jargon } from "@/components/Jargon";
import { findModel } from "@/data/moneyModels";
import { ModelSelect } from "@/components/ModelSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Save, FileDown, Sparkles, Pencil } from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_STAGES = () => [
  { id: uid(), name: "They discover you", happening: "", painPoints: [] },
  { id: uid(), name: "They check you out", happening: "", painPoints: [] },
  { id: uid(), name: "They buy for the first time", happening: "", painPoints: [] },
  { id: uid(), name: "They use it & get results", happening: "", painPoints: [] },
  { id: uid(), name: "They come back & tell friends", happening: "", painPoints: [] },
];

const EMPTY_ICP = { who: "", want: "", blocker: "", words: "" };

function OfferDialog({ open, onOpenChange, initial, onSave }) {
  const [offer, setOffer] = useState(initial || { modelKey: "", name: "", price: "", whenText: "" });

  useEffect(() => {
    if (open) setOffer(initial || { modelKey: "", name: "", price: "", whenText: "" });
  }, [open, initial]);

  const set = (patch) => setOffer((o) => ({ ...o, ...patch }));
  const valid = offer.modelKey && offer.name.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {initial ? "Change this offer" : "Create an offer for this pain point"}
          </DialogTitle>
          <DialogDescription>
            Pick a money model that solves this pain. You can change it anytime to see what fits.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">Money model</Label>
            <ModelSelect
              value={offer.modelKey}
              onChange={(v) => set({ modelKey: v })}
              testId="journey-offer-model-select"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-neutral-500">Offer name</Label>
            <Input
              data-testid="journey-offer-name-input"
              value={offer.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Welcome Kit"
              className="focus-visible:ring-black"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Price ($)</Label>
              <Input
                data-testid="journey-offer-price-input"
                type="number"
                min="0"
                value={offer.price}
                onChange={(e) => set({ price: e.target.value })}
                placeholder="99"
                className="focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">When?</Label>
              <Input
                data-testid="journey-offer-when-input"
                value={offer.whenText}
                onChange={(e) => set({ whenText: e.target.value })}
                placeholder="e.g. at checkout"
                className="focus-visible:ring-black"
              />
            </div>
          </div>
          <Button
            data-testid="journey-offer-save-button"
            disabled={!valid}
            onClick={() => {
              onSave(offer);
              onOpenChange(false);
            }}
            className="w-full h-11 bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
          >
            {initial ? "Update offer" : "Attach offer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function JourneyPage() {
  const { current, updateBusiness } = useBusiness();
  const [stages, setStages] = useState([]);
  const [icp, setIcp] = useState(EMPTY_ICP);
  const [valueProp, setValueProp] = useState("");
  const [newPain, setNewPain] = useState({});
  const [offerTarget, setOfferTarget] = useState(null); // {stageId, painId, initial}
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    setStages(
      current.journey?.stages?.length ? current.journey.stages : DEFAULT_STAGES()
    );
    setIcp({ ...EMPTY_ICP, ...(current.icp || {}) });
    setValueProp(current.value_prop || "");
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const saveAll = async () => {
    setSaving(true);
    try {
      await updateBusiness({ journey: { stages }, icp, value_prop: valueProp });
      toast.success("Journey saved");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
    setSaving(false);
  };

  const patchStage = (id, patch) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addPain = (stageId) => {
    const text = (newPain[stageId] || "").trim();
    if (!text) return;
    patchStage(stageId, {
      painPoints: [
        ...(stages.find((s) => s.id === stageId)?.painPoints || []),
        { id: uid(), text, offer: null },
      ],
    });
    setNewPain((p) => ({ ...p, [stageId]: "" }));
  };

  const patchPain = (stageId, painId, patch) => {
    const stage = stages.find((s) => s.id === stageId);
    patchStage(stageId, {
      painPoints: stage.painPoints.map((p) => (p.id === painId ? { ...p, ...patch } : p)),
    });
  };

  const removePain = (stageId, painId) => {
    const stage = stages.find((s) => s.id === stageId);
    patchStage(stageId, { painPoints: stage.painPoints.filter((p) => p.id !== painId) });
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 fade-up">
        <div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
            Customer journey
          </h1>
          <p className="mt-2 text-neutral-500 text-sm sm:text-base max-w-2xl leading-relaxed">
            Walk in your customer's shoes, end to end. Spot the painful moments before they do —
            then turn each one into an offer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="export-pdf-button"
            variant="outline"
            onClick={exportPdf}
            className="border-neutral-300 hover:border-black transition-colors duration-200"
          >
            <FileDown size={15} className="mr-2" /> Save as PDF
          </Button>
          <Button
            data-testid="save-journey-button"
            onClick={saveAll}
            disabled={saving}
            className="bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
          >
            <Save size={15} className="mr-2" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-up fade-up-1">
        {/* Stages */}
        <div className="lg:col-span-2 space-y-4">
          {stages.map((stage, si) => (
            <div
              key={stage.id}
              data-testid={`journey-stage-${si}`}
              className="bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 space-y-4 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-shadow duration-300"
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                  {si + 1}
                </span>
                <Input
                  data-testid={`stage-name-${si}`}
                  value={stage.name}
                  onChange={(e) => patchStage(stage.id, { name: e.target.value })}
                  className="font-bold border-transparent hover:border-neutral-200 focus-visible:ring-black px-2"
                />
                <button
                  data-testid={`delete-stage-${si}`}
                  onClick={() => setStages((prev) => prev.filter((s) => s.id !== stage.id))}
                  className="text-neutral-300 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <Textarea
                data-testid={`stage-happening-${si}`}
                value={stage.happening}
                onChange={(e) => patchStage(stage.id, { happening: e.target.value })}
                placeholder="What's happening here? What does the customer see, feel, expect?"
                className="text-sm min-h-[60px] focus-visible:ring-black"
              />

              {/* Pain points */}
              <div className="space-y-2">
                {(stage.painPoints || []).map((pain) => {
                  const model = pain.offer ? findModel(pain.offer.modelKey) : null;
                  return (
                    <div
                      key={pain.id}
                      data-testid={`pain-point-${pain.id}`}
                      className="bg-neutral-50 border border-neutral-200 rounded-md p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed">
                          <span className="font-bold text-xs uppercase tracking-widest text-neutral-400 mr-2">
                            Pain
                          </span>
                          {pain.text}
                        </p>
                        <button
                          data-testid={`remove-pain-${pain.id}`}
                          onClick={() => removePain(stage.id, pain.id)}
                          className="text-neutral-300 hover:text-black shrink-0 transition-colors duration-200"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {pain.offer ? (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <Badge className="bg-black text-white hover:bg-black rounded-full">
                            <Sparkles size={11} className="mr-1" /> {pain.offer.name}
                          </Badge>
                          <span className="text-xs text-neutral-500">
                            {model?.name}
                            {pain.offer.price ? ` · ${fmt(pain.offer.price)}` : ""}
                            {pain.offer.whenText ? ` · ${pain.offer.whenText}` : ""}
                          </span>
                          <button
                            data-testid={`edit-offer-${pain.id}`}
                            onClick={() =>
                              setOfferTarget({ stageId: stage.id, painId: pain.id, initial: pain.offer })
                            }
                            className="text-xs font-medium underline underline-offset-2 hover:text-neutral-500 transition-colors duration-200 flex items-center gap-1"
                          >
                            <Pencil size={11} /> Change
                          </button>
                        </div>
                      ) : (
                        <Button
                          data-testid={`create-offer-${pain.id}`}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setOfferTarget({ stageId: stage.id, painId: pain.id, initial: null })
                          }
                          className="mt-2.5 h-7 text-xs border-neutral-300 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                        >
                          <Plus size={12} className="mr-1" /> Create offer
                        </Button>
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-2">
                  <Input
                    data-testid={`new-pain-input-${si}`}
                    value={newPain[stage.id] || ""}
                    onChange={(e) => setNewPain((p) => ({ ...p, [stage.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addPain(stage.id)}
                    placeholder="Add a need or pain point..."
                    className="text-sm focus-visible:ring-black"
                  />
                  <Button
                    data-testid={`add-pain-button-${si}`}
                    variant="outline"
                    onClick={() => addPain(stage.id)}
                    className="border-neutral-300 hover:border-black transition-colors duration-200"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <Button
            data-testid="add-stage-button"
            variant="outline"
            onClick={() =>
              setStages((prev) => [
                ...prev,
                { id: uid(), name: "New stage", happening: "", painPoints: [] },
              ])
            }
            className="w-full border-dashed border-neutral-300 hover:border-black transition-colors duration-200"
          >
            <Plus size={14} className="mr-1.5" /> Add a stage
          </Button>
        </div>

        {/* ICP & Value prop panel */}
        <div>
          <div
            data-testid="icp-panel"
            className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-5 lg:sticky lg:top-24"
          >
            <div>
              <h2 className="font-heading font-extrabold text-lg tracking-tight">
                Your <Jargon term="ICP">dream customer</Jargon>
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                Keep this in view while you map. Always editable.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Who are they?</Label>
              <Input
                data-testid="icp-who-input"
                value={icp.who}
                onChange={(e) => setIcp({ ...icp, who: e.target.value })}
                placeholder="e.g. Busy moms, 30-45"
                className="bg-white focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">What do they want?</Label>
              <Input
                data-testid="icp-want-input"
                value={icp.want}
                onChange={(e) => setIcp({ ...icp, want: e.target.value })}
                placeholder="e.g. To feel fit without dieting"
                className="bg-white focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">What's in their way?</Label>
              <Input
                data-testid="icp-blocker-input"
                value={icp.blocker}
                onChange={(e) => setIcp({ ...icp, blocker: e.target.value })}
                placeholder="e.g. No time, gym anxiety"
                className="bg-white focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-neutral-500">Words they actually use</Label>
              <Input
                data-testid="icp-words-input"
                value={icp.words}
                onChange={(e) => setIcp({ ...icp, words: e.target.value })}
                placeholder='e.g. "I just want my energy back"'
                className="bg-white focus-visible:ring-black"
              />
            </div>
            <div className="space-y-1.5 pt-3 border-t border-neutral-200">
              <Label className="text-xs text-neutral-500">
                Your <Jargon term="VALUEPROP">value prop</Jargon> — in their words
              </Label>
              <Textarea
                data-testid="value-prop-input"
                value={valueProp}
                onChange={(e) => setValueProp(e.target.value)}
                placeholder='e.g. "We help busy moms get their energy back in 20 minutes a day — no gym, no diets."'
                className="bg-white text-sm min-h-[90px] focus-visible:ring-black"
              />
              <p className="text-xs text-neutral-400">
                This shows as a banner on your dashboard so you never forget it.
              </p>
            </div>
          </div>
        </div>
      </div>

      <OfferDialog
        open={!!offerTarget}
        onOpenChange={(v) => !v && setOfferTarget(null)}
        initial={offerTarget?.initial}
        onSave={(offer) => patchPain(offerTarget.stageId, offerTarget.painId, { offer })}
      />

      {/* ---- Print-only expanded journey map ---- */}
      <div className="print-only">
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          {current.name} — Customer Journey Map
        </h1>
        <p style={{ fontSize: 11, color: "#666", marginBottom: 16 }}>
          Exported from margin. · {new Date().toLocaleDateString("en-US")}
        </p>
        <div style={{ border: "1px solid #ddd", padding: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 12, margin: "2px 0" }}>
            <strong>Dream customer:</strong> {icp.who || "—"}
          </p>
          <p style={{ fontSize: 12, margin: "2px 0" }}>
            <strong>They want:</strong> {icp.want || "—"}
          </p>
          <p style={{ fontSize: 12, margin: "2px 0" }}>
            <strong>In their way:</strong> {icp.blocker || "—"}
          </p>
          <p style={{ fontSize: 12, margin: "2px 0" }}>
            <strong>Their words:</strong> {icp.words || "—"}
          </p>
          <p style={{ fontSize: 13, marginTop: 8 }}>
            <strong>Value prop:</strong> “{valueProp || "—"}”
          </p>
        </div>
        {stages.map((stage, i) => (
          <div key={stage.id} style={{ marginBottom: 18, pageBreakInside: "avoid" }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              {i + 1}. {stage.name}
            </h2>
            {stage.happening && (
              <p style={{ fontSize: 12, color: "#444", margin: "4px 0 8px" }}>{stage.happening}</p>
            )}
            {(stage.painPoints || []).length === 0 ? (
              <p style={{ fontSize: 11, color: "#999" }}>No pain points mapped.</p>
            ) : (
              (stage.painPoints || []).map((pain) => {
                const model = pain.offer ? findModel(pain.offer.modelKey) : null;
                return (
                  <div
                    key={pain.id}
                    style={{ borderLeft: "3px solid #000", paddingLeft: 10, margin: "6px 0" }}
                  >
                    <p style={{ fontSize: 12, margin: 0 }}>
                      <strong>Pain:</strong> {pain.text}
                    </p>
                    {pain.offer && (
                      <p style={{ fontSize: 12, margin: "2px 0 0", color: "#333" }}>
                        ★ <strong>Offer:</strong> {pain.offer.name} ({model?.name}
                        {pain.offer.price ? ` · ${fmt(pain.offer.price)}` : ""}
                        {pain.offer.whenText ? ` · ${pain.offer.whenText}` : ""})
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
