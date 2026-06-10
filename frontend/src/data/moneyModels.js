// Alex Hormozi's $100M Money Models — explained in plain English.

export const CATEGORIES = [
  {
    key: "attraction",
    name: "Get customers in the door",
    subtitle: "Attraction offers — deals so good people can't ignore you. Use these first.",
    models: [
      {
        key: "win_money_back",
        name: "Win Your Money Back",
        plain:
          "They pay you, and if they hit a goal you both agree on, they get the money back (usually as credit toward your next thing). People pay to stay committed.",
        example: "A gym: \"Pay $500 for the 6-week challenge. Lose 10 lbs and the $500 goes toward a membership.\"",
        when: "Your very first paid offer — the front door.",
      },
      {
        key: "giveaway",
        name: "Giveaway",
        plain:
          "Run a contest with one big prize. Everyone who doesn't win gets a smaller deal or credit. You turn a crowd of 'losers' into buyers.",
        example: "\"Win a year of coaching free! Didn't win? Here's 50% off your first month.\"",
        when: "When you need a burst of new leads fast.",
      },
      {
        key: "decoy",
        name: "Decoy Offer",
        plain:
          "Advertise a cheap 'starter' version to get people in. Once they show up, most choose the better full version on their own.",
        example: "Advertise a $39 intro class. When they arrive, most pick the $199 full program.",
        when: "In your ads — the low price gets the click.",
      },
      {
        key: "buy_x_get_y",
        name: "Buy X Get Y Free",
        plain:
          "Bundle more units together for a deal. It feels like a gift, and each customer ends up spending more in total.",
        example: "\"Buy 2 months, get 1 free\" instead of discounting one month.",
        when: "At checkout, to raise the first purchase size.",
      },
      {
        key: "pay_less_now",
        name: "Pay Less Now or Pay More Later",
        plain:
          "Give two ways to pay: a smaller price today, or a bigger total split over time. Either way, more people can say yes.",
        example: "\"$1,000 today, or 3 payments of $400.\"",
        when: "Right when they're deciding — removes the price excuse.",
      },
      {
        key: "free_with_deposit",
        name: "Free With a Down Payment",
        plain:
          "The offer is 'free', but they leave a deposit. The deposit becomes credit toward the next thing they buy. Free, but with skin in the game.",
        example: "\"Free workshop — $100 deposit, fully credited toward the course if you join.\"",
        when: "For free events or trials, so people actually show up.",
      },
    ],
  },
  {
    key: "upsell",
    name: "Earn more right away",
    subtitle: "Upsell offers — the natural next step, offered the moment they say yes.",
    models: [
      {
        key: "classic_upsell",
        name: "Classic Upsell",
        plain:
          "Right after they buy, offer the next thing that makes the first thing work even better. They're already saying yes — keep going.",
        example: "Bought the meal plan? \"Add weekly check-ins for $99/month.\"",
        when: "Within minutes of their first purchase.",
      },
      {
        key: "menu_upsell",
        name: "Menu Upsell",
        plain:
          "Show a short menu of add-ons at checkout, like fries with a burger. Small extras add up fast.",
        example: "A photographer's checkout: prints +$50, extra edits +$75, rush delivery +$40.",
        when: "At checkout, every single time.",
      },
      {
        key: "anchor_upsell",
        name: "Anchor Upsell",
        plain:
          "Show your most expensive premium option first. Next to it, your real offer feels easy to say yes to — and some people take the big one.",
        example: "Show the $5,000 VIP package first, then the $1,500 standard feels reasonable.",
        when: "When presenting your options — biggest first.",
      },
      {
        key: "rollover_upsell",
        name: "Rollover Upsell",
        plain:
          "Whatever they already paid counts as credit toward the bigger thing. Their money 'rolls over', so upgrading feels free.",
        example: "\"Your $500 challenge fee counts fully toward the $2,000 program.\"",
        when: "When a small offer ends and they're happy.",
      },
    ],
  },
  {
    key: "downsell",
    name: "Save the no's",
    subtitle: "Downsell offers — a smaller yes for people who almost bought.",
    models: [
      {
        key: "payment_plan",
        name: "Payment Plan",
        plain:
          "Same exact offer, split into smaller chunks over time. The price didn't change — the bite size did.",
        example: "\"Can't do $1,200 today? How about 4 payments of $300?\"",
        when: "Right after they say 'it's too expensive'.",
      },
      {
        key: "trial_with_penalty",
        name: "Trial With a Catch",
        plain:
          "Let them try it free — but they pay if they quit early or don't do the work. Free to start, costly to flake.",
        example: "\"Free 2-week trial. Skip more than 2 sessions and the card on file is charged $99.\"",
        when: "For people who want proof before paying.",
      },
      {
        key: "feast_famine",
        name: "Less for Less",
        plain:
          "Strip the offer down to its core and sell the smaller version cheaper. They still become a customer — you can upgrade them later.",
        example: "Can't afford 1-on-1 coaching? Offer the group version at a third of the price.",
        when: "As the last resort before they walk away.",
      },
    ],
  },
  {
    key: "continuity",
    name: "Get paid every month",
    subtitle: "Continuity offers — turn one-time buyers into subscribers.",
    models: [
      {
        key: "continuity_bonus",
        name: "Join-Now Bonus",
        plain:
          "Give a one-time gift the moment they subscribe. The gift makes joining today feel like a no-brainer.",
        example: "\"Subscribe today and get the starter kit ($150 value) free.\"",
        when: "Right after they get their first win with you.",
      },
      {
        key: "continuity_discount",
        name: "Commit & Save",
        plain:
          "Offer a lower monthly rate if they commit for longer. They save money, you get predictable income.",
        example: "\"$99/month, or $79/month if you commit to 12 months.\"",
        when: "When they're renewing or clearly love it.",
      },
      {
        key: "waived_fee",
        name: "Skip-the-Fee",
        plain:
          "There's a setup or joining fee — but you waive it if they sign up for the monthly plan. Subscribing feels like the smart deal.",
        example: "\"$200 setup fee — waived if you join the monthly plan today.\"",
        when: "At sign-up, to nudge one-timers into monthly.",
      },
    ],
  },
];

export const ALL_MODELS = CATEGORIES.flatMap((c) =>
  c.models.map((m) => ({ ...m, category: c.key, categoryName: c.name }))
);

export const findModel = (key) => ALL_MODELS.find((m) => m.key === key);
