// All the money math lives here, in one place.

export const fmt = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: Math.abs(n) < 100 && n % 1 !== 0 ? 2 : 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

export const pct = (n) => `${Math.round(Number.isFinite(n) ? n : 0)}%`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// ---- Offers / unit economics ----

export function offerMath(offer) {
  const price = num(offer.price);
  const cost = num(offer.cost);
  const units = num(offer.unitsPerMonth);
  const profitPerUnit = price - cost;
  const margin = price > 0 ? (profitPerUnit / price) * 100 : 0;
  return {
    price,
    cost,
    units,
    profitPerUnit,
    margin,
    monthlyRevenue: price * units,
    monthlyCost: cost * units,
    monthlyProfit: profitPerUnit * units,
  };
}

export function simulationMath(offers = []) {
  const rows = offers.map(offerMath);
  const monthlyRevenue = rows.reduce((s, r) => s + r.monthlyRevenue, 0);
  const monthlyCost = rows.reduce((s, r) => s + r.monthlyCost, 0);
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const margin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;
  return { monthlyRevenue, monthlyCost, monthlyProfit, margin, profitable: monthlyProfit > 0 };
}

// ---- Money model metrics ----
// Each step: { price, cost, takeRate (0-100), whenDays, recurring }

export function modelMetrics(steps = [], xCustomers = 100) {
  let day30Revenue = 0;
  let day30GP = 0;
  let ltvRevenue = 0;
  let ltvGP = 0;

  steps.forEach((s) => {
    const take = num(s.takeRate) / 100;
    const price = num(s.price);
    const cost = num(s.cost);
    const whenDays = num(s.whenDays);
    const revUnit = price * take;
    const gpUnit = (price - cost) * take;

    if (s.recurring) {
      const monthsActive = Math.max(0, Math.min(12, 12 - Math.floor(whenDays / 30)));
      if (whenDays <= 30 && monthsActive > 0) {
        day30Revenue += revUnit;
        day30GP += gpUnit;
      }
      ltvRevenue += revUnit * monthsActive;
      ltvGP += gpUnit * monthsActive;
    } else {
      if (whenDays <= 30) {
        day30Revenue += revUnit;
        day30GP += gpUnit;
      }
      if (whenDays <= 365) {
        ltvRevenue += revUnit;
        ltvGP += gpUnit;
      }
    }
  });

  const x = Math.max(0, num(xCustomers));
  return {
    day30Revenue,
    day30GP,
    ltvRevenue,
    ltvGP,
    maxCAC: day30GP,
    healthyCAC: ltvGP / 3,
    totals: {
      revenue30: day30Revenue * x,
      gp30: day30GP * x,
      ltvGP: ltvGP * x,
      ltvRevenue: ltvRevenue * x,
    },
  };
}
