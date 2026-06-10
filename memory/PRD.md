# PRD — margin. (Unit Economics App)

## Original Problem Statement
A unit economics app that is dead simple for anyone who doesn't easily understand business, finance, debt or money models. Plain language, jargon tooltips (LTV, CAC...). Features: multiple businesses to switch between (like Slack orgs); offers page (base/core/upsell, define a unit, cost, profitability, save & compare simulations); Hormozi 100M money models page (pick model(s), simple explanations, WHEN to offer, model LTV + target CAC, 30-day acquisition & GP with X customers); customer journey page (map end-to-end, pain points → "create offer" with model picker, editable ICP & value prop panel, save as PDF); dashboard (one-sentence offers, per-customer acquisition $, 30-day GP, 12-month LTV, totals for X customers, value prop banner). Clean minimal black & white, premium feel, parallax/animations, mobile-ready, snappy consumer-app UX.

## User Choices
- Simple email/password login (JWT, httpOnly cookies)
- Clean printable PDF export (browser print)
- Full Hormozi model set (16 models, 4 categories)
- USD only; manual calculators, no AI

## Architecture
- FastAPI + MongoDB (motor) + React (CRA + craco), shadcn/ui, Tailwind, framer-motion
- Auth: bcrypt + PyJWT, access (15min) + refresh (7d) httpOnly cookies, axios auto-refresh interceptor, brute-force lockout (5 fails / 15 min), admin seeded on startup
- Data model: users; businesses (embeds icp, value_prop, money_model{steps, x_customers}, journey{stages}); simulations (per business)
- All money math in frontend `/app/frontend/src/lib/calc.js` (offerMath, simulationMath, modelMetrics)
- Model catalog: `/app/frontend/src/data/moneyModels.js`
- Key files: backend/server.py; frontend/src/pages/{AuthPage,Dashboard,OffersPage,MoneyModelsPage,JourneyPage}.js; components/{Layout,Jargon,ModelSelect}.js; context/{AuthContext,BusinessContext}.js

## User Personas
- Non-technical small business owner / creator exploring whether their offers make money, familiar with consumer apps, not finance.

## Implemented (June 10, 2026 — MVP)
- Email/password auth (register/login/logout/refresh/me), brute force protection
- Business switcher (Slack-style), first-business onboarding, per-business data isolation
- Offers page: base/core/upsell offers, unit definition, live profit verdict, save simulations, side-by-side compare (up to 3)
- Money Models page: 16 Hormozi models w/ plain explanations + examples + "when"; step builder (model, offer, price, cost, take-rate slider, WHEN text + days, recurring); per-customer 30-day revenue/GP, 12-mo LTV, target CAC (LTV/3 + 30-day breakeven), X-customers totals; reorder/edit/delete steps
- Journey page: editable stages + pain points, "Create offer" → model picker dialog (changeable), sticky editable ICP + value prop panel, print-to-PDF expanded map with offers notated
- Dashboard: parallax value-prop banner, bento metrics (acquisition $, 30-day GP, 12-mo LTV, target CAC), X-customers slider + totals, one-sentence offers, empty-state CTAs
- Jargon tooltips: LTV, CAC, GP, ICP, Margin, Unit, Take rate, Value Prop
- Mobile: bottom tab nav, responsive layouts
- Tested: iteration_1 — backend 100%, frontend 100%

## Backlog (prioritized)
- P1: Production hardening — CORS explicit origins, secure=True cookies (env-driven)
- P1: Link saved simulations into money model steps (pull offers in instead of retyping)
- P2: Rename/delete business from UI; forgot-password flow
- P2: Disabled-button helper hint in step dialog (testing agent nit)
- P2: Charts (revenue over 12 months), richer PDF with metrics summary

## Next Tasks
- Gather user feedback on MVP, then P1 items above.
