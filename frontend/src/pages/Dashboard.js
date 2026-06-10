import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useBusiness } from "@/context/BusinessContext";
import { fmt, modelMetrics } from "@/lib/calc";
import { Jargon } from "@/components/Jargon";
import { findModel } from "@/data/moneyModels";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ArrowRight, Package, Coins, Map } from "lucide-react";

const BANNER_IMG =
  "https://images.unsplash.com/photo-1533135091724-62cc5402aa20?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODl8MHwxfHNlYXJjaHwyfHxhYnN0cmFjdCUyMG1pbmltYWwlMjB3aGl0ZSUyMGFuZCUyMGJsYWNrJTIwdGV4dHVyZXxlbnwwfHx8fDE3ODEwNjE2OTV8MA&ixlib=rb-4.1.0&q=85";

function MetricCard({ title, value, sub, testId, big }) {
  return (
    <div
      data-testid={testId}
      className={`bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300 ${
        big ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">{title}</p>
      <p className="mt-3 font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">{value}</p>
      {sub && <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{sub}</p>}
    </div>
  );
}

function EmptyCta({ to, icon: Icon, title, text, testId }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className="group bg-white border border-neutral-200 rounded-lg p-8 hover:border-black hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.15)] transition-all duration-300"
    >
      <Icon size={22} className="text-neutral-400 group-hover:text-black transition-colors duration-300" />
      <h3 className="mt-4 font-heading font-bold text-lg tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{text}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium">
        Start <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
      </span>
    </Link>
  );
}

export default function Dashboard() {
  const { current, updateBusiness } = useBusiness();
  const steps = current?.money_model?.steps || [];
  const [x, setX] = useState(current?.money_model?.x_customers ?? 100);
  const bannerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: bannerRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  useEffect(() => {
    setX(current?.money_model?.x_customers ?? 100);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;
  const m = modelMetrics(steps, x);
  const hasModel = steps.length > 0;

  const persistX = (val) => {
    updateBusiness({ money_model: { ...(current.money_model || {}), x_customers: val } }).catch(() => {});
  };

  return (
    <div className="space-y-8">
      {/* Value prop banner with parallax */}
      <div
        ref={bannerRef}
        data-testid="value-prop-banner"
        className="relative overflow-hidden rounded-xl bg-black text-white fade-up"
      >
        <motion.img
          src={BANNER_IMG}
          alt=""
          style={{ y: parallaxY }}
          className="absolute inset-0 w-full h-[130%] object-cover opacity-20 -top-[15%]"
        />
        <div className="relative z-10 p-8 sm:p-12">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
            {current.name} — your <Jargon term="VALUEPROP">value prop</Jargon>
          </p>
          {current.value_prop ? (
            <h1 className="mt-4 font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.1] max-w-3xl">
              “{current.value_prop}”
            </h1>
          ) : (
            <div className="mt-4">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight text-neutral-300">
                You haven't written your value promise yet.
              </h1>
              <Link
                to="/journey"
                data-testid="banner-set-value-prop-link"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium bg-white text-black px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors duration-200"
              >
                Write it now <ArrowRight size={14} />
              </Link>
            </div>
          )}
          {current.icp?.who && (
            <p className="mt-4 text-sm text-neutral-400">
              Said in the words of: <span className="text-neutral-200">{current.icp.who}</span>
            </p>
          )}
        </div>
      </div>

      {hasModel ? (
        <>
          {/* Per-customer metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 fade-up fade-up-1">
            <MetricCard
              testId="metric-acquisition-revenue"
              title="One new customer pays you"
              value={fmt(m.day30Revenue)}
              sub="Money in, during their first 30 days."
            />
            <MetricCard
              testId="metric-30day-gp"
              title={
                <>
                  You keep (<Jargon term="GP">gross profit</Jargon>)
                </>
              }
              title2="30-day profit"
              value={fmt(m.day30GP)}
              sub="Profit per customer in the first 30 days."
            />
            <MetricCard
              testId="metric-12mo-ltv"
              title={<Jargon term="LTV">12-month LTV</Jargon>}
              value={fmt(m.ltvGP)}
              sub="Profit one customer brings over a year."
            />
            <MetricCard
              testId="metric-target-cac"
              title={
                <>
                  Target <Jargon term="CAC">CAC</Jargon>
                </>
              }
              value={fmt(m.healthyCAC)}
              sub={`Spend less than this to get a customer. To break even in 30 days, stay under ${fmt(m.maxCAC)}.`}
            />
          </div>

          {/* X customers */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 sm:p-10 fade-up fade-up-2">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
                  What if you got...
                </p>
                <h2 className="mt-2 font-heading font-extrabold text-2xl sm:text-3xl tracking-tight">
                  {x} customers
                </h2>
              </div>
              <Input
                data-testid="dashboard-x-customers-input"
                type="number"
                min="0"
                value={x}
                onChange={(e) => setX(Math.max(0, Number(e.target.value)))}
                onBlur={() => persistX(x)}
                className="w-28 h-11 text-center font-bold focus-visible:ring-black"
              />
            </div>
            <Slider
              data-testid="dashboard-x-customers-slider"
              value={[Math.min(x, 1000)]}
              onValueChange={([v]) => setX(v)}
              onValueCommit={([v]) => persistX(v)}
              min={0}
              max={1000}
              step={5}
              className="mt-8"
            />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div data-testid="totals-revenue-30">
                <p className="text-sm text-neutral-500">Money in (first 30 days)</p>
                <p className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight mt-1">
                  {fmt(m.totals.revenue30)}
                </p>
              </div>
              <div data-testid="totals-gp-30">
                <p className="text-sm text-neutral-500">
                  <Jargon term="GP">Profit</Jargon> (first 30 days)
                </p>
                <p className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight mt-1">
                  {fmt(m.totals.gp30)}
                </p>
              </div>
              <div data-testid="totals-ltv-12mo">
                <p className="text-sm text-neutral-500">
                  <Jargon term="LTV">Profit over 12 months</Jargon>
                </p>
                <p className="font-heading font-extrabold text-2xl sm:text-3xl tracking-tight mt-1">
                  {fmt(m.totals.ltvGP)}
                </p>
              </div>
            </div>
          </div>

          {/* Offers, one sentence each */}
          <div className="fade-up fade-up-3">
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight">
              Your offers, one sentence each
            </h2>
            <div className="mt-4 space-y-3">
              {steps.map((s, i) => {
                const model = findModel(s.modelKey);
                return (
                  <div
                    key={s.id || i}
                    data-testid={`dashboard-offer-sentence-${i}`}
                    className="flex items-start gap-4 bg-white border border-neutral-200 rounded-lg p-5 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-shadow duration-300"
                  >
                    <span className="shrink-0 w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm sm:text-base leading-relaxed">
                      <span className="font-bold">{s.offerName || "Untitled offer"}</span>
                      {" — "}
                      {model?.name || "a money model"} at {fmt(s.price)}
                      {s.recurring ? "/month" : ""},{" "}
                      offered {s.whenText ? s.whenText.toLowerCase() : `around day ${s.whenDays || 0}`}.
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 fade-up fade-up-2">
          <EmptyCta
            to="/offers"
            icon={Package}
            title="Define your offers"
            text="What do you sell, what does one unit cost you, and is it profitable?"
            testId="empty-cta-offers"
          />
          <EmptyCta
            to="/models"
            icon={Coins}
            title="Build your money model"
            text="Pick proven plays to earn more from every customer — then see your numbers here."
            testId="empty-cta-models"
          />
          <EmptyCta
            to="/journey"
            icon={Map}
            title="Map the customer journey"
            text="Spot pain points before your customer does, and turn them into offers."
            testId="empty-cta-journey"
          />
        </div>
      )}
    </div>
  );
}
