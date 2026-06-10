import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TERMS = {
  LTV: {
    title: "LTV — Lifetime Value",
    text: "The total money one customer brings you over time. Here, we look at 12 months.",
  },
  CAC: {
    title: "CAC — Customer Acquisition Cost",
    text: "What it costs you to get one new customer (ads, time, commissions...).",
  },
  GP: {
    title: "Gross Profit",
    text: "Money left after paying what it costs to deliver. Price minus cost — before rent, salaries, etc.",
  },
  ICP: {
    title: "ICP — Ideal Customer Profile",
    text: "A simple description of your dream customer: who they are, what they want, what's in their way.",
  },
  MARGIN: {
    title: "Margin",
    text: "The slice of each sale you actually keep, as a percentage. $100 sale with $40 of costs = 60% margin.",
  },
  UNIT: {
    title: "Unit",
    text: "One 'thing' you sell. A session, a haircut, a box, a month of membership — you decide.",
  },
  TAKERATE: {
    title: "Take rate",
    text: "Out of every 100 customers who see this offer, how many say yes.",
  },
  VALUEPROP: {
    title: "Value Prop — Value Proposition",
    text: "One sentence that says who you help, what they get, and why you over anyone else.",
  },
};

export function Jargon({ term, children }) {
  const info = TERMS[term];
  if (!info) return <span>{children || term}</span>;
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          data-testid={`jargon-${term.toLowerCase()}`}
          className="cursor-help border-b border-dashed border-neutral-400 focus:outline-none focus:ring-1 focus:ring-black"
        >
          {children || term}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[260px] bg-neutral-800 text-white border-neutral-700">
        <p className="font-semibold text-xs mb-1">{info.title}</p>
        <p className="text-xs leading-relaxed text-neutral-200">{info.text}</p>
      </TooltipContent>
    </Tooltip>
  );
}
