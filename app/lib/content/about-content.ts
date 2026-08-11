/**
 * Content model for the public /about page.
 *
 * Mirrors EnergyTalents/app/about section-for-section, including the three
 * carousels (story, values, offices) which each hold their own slide data.
 *
 * Conventions used throughout:
 *  - Headings are split into `titleLead` / `titleAccent` where the design
 *    renders part of the line in orange. A `\n` in a title is a line break.
 *  - Sequence numbers (01 / 02 / Protocol 03 …) are NOT stored — they are
 *    derived from array position, so reordering can never leave them wrong.
 *  - Icons are stored as string names and resolved on the frontend, because
 *    component references can't cross the server→client boundary.
 *
 * The whole page is one JSON column, so adding a card or a region never
 * requires a schema migration.
 */

/** Icon names exported by EnergyTalents/app/about/icons.tsx. */
export const ABOUT_ICON_NAMES = [
  "IconShield",
  "IconCheck",
  "IconUsers",
  "IconGlobe",
  "IconClock",
  "IconBolt",
  "IconTarget",
  "IconSun",
  "IconPhone",
  "IconMapPin",
] as const;

export type AboutIconName = (typeof ABOUT_ICON_NAMES)[number] | (string & {});

export type CtaLink = { text: string; href: string };

/**
 * One slide of the story carousel.
 *
 * Both layouts share the same left-hand column (badge, heading, body, links).
 * `panel` picks what fills the mock browser window on the right: a numbered
 * step list or a grid of region cards. The unused array is simply ignored, so
 * switching panel type never loses the other one's content.
 */
export type StorySlidePanel = "steps" | "regions";

export type StorySlide = {
  badge: string;
  /** `\n` marks the line break. */
  title: string;
  body: string;
  links: CtaLink[];
  /** Pill in the mock browser chrome. */
  windowBadge: string;
  panel: StorySlidePanel;
  /** Numbered 01…n automatically. Used when panel = "steps". */
  steps: { title: string; body: string }[];
  /** Two-column cards. Used when panel = "regions". */
  regions: { tag: string; city: string; desk: string }[];
};

export type AboutPageContent = {
  /** 1 — centred hero with a pill badge and two CTAs. */
  hero: {
    badgePrefix: string;
    badgeStrong: string;
    titleLead: string;
    /** Rendered in orange, mid-sentence. */
    titleAccent: string;
    titleTail: string;
    subtitle: string;
    ctaPrimary: CtaLink;
    ctaSecondary: CtaLink;
  };

  /** 2 — the story carousel. Any number of slides; add or remove in the CMS. */
  story: {
    slides: StorySlide[];
  };

  /** 3 — "Mobilize every technical role", with two marquee rows. */
  sectors: {
    titleAccent: string;
    titleRest: string;
    subtitle: string;
    rolesRowOne: string[];
    rolesRowTwo: string[];
    cta: CtaLink;
  };

  /** 4 — values carousel. Cards numbered automatically. */
  values: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    cards: {
      icon: AboutIconName;
      title: string;
      body: string;
      proofLead: string;
      proof: string;
    }[];
  };

  /** 5 — HSE protocol tiles. "Protocol 01" is derived. */
  hse: {
    kicker: string;
    titleLead: string;
    titleAccent: string;
    intro: string;
    /** Label placed before the derived number, e.g. "Protocol". */
    protocolLabel: string;
    protocols: { title: string; body: string }[];
  };

  /** 6 — crisis timeline plus the three mini stats. */
  crisis: {
    kicker: string;
    titleLead: string;
    titleAccent: string;
    intro: string;
    steps: { title: string; when: string; body: string }[];
    stats: { big: string; small: string }[];
  };

  /** 7 — office / hub carousel. */
  offices: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    hubs: { tag: string; city: string; addr: string; desk: string; coords: string }[];
  };

  /** 8 — internal vacancies. */
  careers: {
    kicker: string;
    title: string;
    intro: string;
    jobs: { where: string; title: string; body: string; href: string }[];
    cta: CtaLink;
  };

  /** 9 — final gradient CTA banner. */
  finalCta: {
    title: string;
    body: string;
    ctaPrimary: CtaLink;
    ctaSecondary: CtaLink;
  };
};

/**
 * The copy the page currently ships with. Seeds the first row and doubles as
 * the frontend's fallback, so /about can never render blank.
 */
export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
  hero: {
    badgePrefix: "India-based",
    badgeStrong: "Energy crewing specialists",
    titleLead: "The people behind the",
    titleAccent: "crews that power",
    titleTail: "the world",
    subtitle:
      "From our base in Tamil Nadu, we recruit, vet and mobilize skilled technical crews to energy projects worldwide — and we still answer the phone when a rotation goes sideways.",
    ctaPrimary: { text: "Our Story", href: "#story" },
    ctaSecondary: { text: "Contact Us", href: "/contact-us" },
  },

  story: {
    slides: [
      {
        badge: "Our Mission",
        title: "No project delayed\nfor lack of crew",
        body: "Everything we do exists to make one thing faster: getting the right person to the right site, compliant and ready.",
        links: [
          { text: "Our Values", href: "#values" },
          { text: "Where We Work", href: "#offices" },
        ],
        windowBadge: "How we work",
        panel: "steps",
        steps: [
          { title: "Source", body: "Vetted technical talent matched to your discipline and scope." },
          { title: "Screen", body: "Certifications, medicals and competency checked before travel." },
          { title: "Mobilize", body: "Visas, flights and onboarding arranged end to end." },
          { title: "Support", body: "A duty desk on call through the whole rotation." },
        ],
        regions: [],
      },
      {
        badge: "Global Deployment",
        title: "Crews placed\nworldwide",
        body: "We recruit and mobilize from India, placing crews across the world's energy regions — screened, compliant and ready.",
        links: [{ text: "Where We Work", href: "#offices" }],
        windowBadge: "24/7 coverage",
        panel: "regions",
        steps: [],
        regions: [
          { tag: "Region", city: "Middle East & Africa", desk: "Upstream, downstream & EPC" },
          { tag: "Region", city: "Europe & North Sea", desk: "Offshore & marine" },
          { tag: "Region", city: "Asia-Pacific", desk: "Oil, gas & renewables" },
          { tag: "Region", city: "The Americas", desk: "Onshore & offshore" },
        ],
      },
    ],
  },

  sectors: {
    titleAccent: "Mobilize every technical role",
    titleRest: "across the energy value chain",
    subtitle:
      "From a single specialist to a full project crew — one partner for sourcing, screening, mobilization, and payroll across every sector and discipline.",
    rolesRowOne: [
      "Drilling Engineer",
      "Subsea ROV Pilot",
      "Marine DPO",
      "Wind Turbine Technician",
      "Solar Grid Specialist",
      "HSE Director",
      "Welding Inspector",
      "Toolpusher",
      "Piping Designer",
      "Project Director",
    ],
    rolesRowTwo: [
      "Mobilization Lead",
      "Payroll Admin",
      "Civil Supervisor",
      "Commissioning Engineer",
      "Crane Operator",
      "Crew Coordinator",
      "QA/QC Inspector",
      "Cost Controller",
      "Rope Access Technician",
      "Geotechnical Engineer",
    ],
    cta: { text: "Explore all sectors", href: "/careers" },
  },

  values: {
    badge: "What we stand for",
    titleLead: "Values written on",
    titleAccent: "rig floors, not walls",
    cards: [
      {
        icon: "IconShield",
        title: "Safety before schedule",
        body: "A crew that comes home safe is the only KPI that can't be traded. We'll decline a placement that doesn't meet our HSE bar.",
        proofLead: "HSE-first",
        proof: "safety comes before the schedule, on every placement",
      },
      {
        icon: "IconCheck",
        title: "Compliance without shortcuts",
        body: "Every certification verified at source, every visa genuine, every contract MLC-clean. Slow paperwork done fast — never skipped.",
        proofLead: "Verified",
        proof: "certifications checked at source and visas confirmed genuine",
      },
      {
        icon: "IconUsers",
        title: "People before placements",
        body: "Contractors get paid on time, in their currency, every rotation. The relationship is meant to outlast the placement.",
        proofLead: "On time",
        proof: "paid correctly, in your currency, every single rotation",
      },
    ],
  },

  hse: {
    kicker: "Operational HSE",
    titleLead: "Safety isn't a value here.",
    titleAccent: "It's a procedure.",
    intro:
      "Every crew we mobilize is covered by the same HSE protocol — no client exemptions, no schedule pressure, no exceptions.",
    protocolLabel: "Protocol",
    protocols: [
      {
        title: "Stop Work Authority",
        body: "Every contractor we place carries unconditional authority to stop a job they believe is unsafe — and our contracts protect their pay and position when they use it.",
      },
      {
        title: "Fit-for-Duty Gate",
        body: "Pre-deployment medicals, drug & alcohol screening, OPITO/GWO currency checks and fatigue-risk review. If one item is open, the traveller does not board.",
      },
      {
        title: "Emergency Mobilization",
        body: "A duty manager is reachable every hour. Medevac coordination, next-of-kin protocol and replacement crew activation run from one escalation chain.",
      },
      {
        title: "Audit & Assurance",
        body: "An ISO 45001-aligned way of working, client-witnessed audits on request, and HSE performance reporting delivered to your ops team unprompted.",
      },
    ],
  },

  crisis: {
    kicker: "Crisis Management · 24/7 Rotation Support",
    titleLead: "Someone answers at 3am.",
    titleAccent: "Every time.",
    intro:
      "Rotations go wrong at the worst possible hour — a cancelled connection, a failed medical, a visa held at the counter. Here is exactly what happens when they do.",
    steps: [
      {
        title: "Flagged & acknowledged",
        when: "Within 15 minutes",
        body: "One number reaches a named duty manager on our desk — never a call centre, never a ticket queue. The contractor, the client rep and the desk lead are on the same thread immediately.",
      },
      {
        title: "Triaged by scenario",
        when: "Pre-written playbooks",
        body: "Flight disruption, medical event, visa or port bottleneck, weather stand-down — each runs on a rehearsed protocol with defined authority to spend, rebook and escalate without waiting for approval.",
      },
      {
        title: "Resolved or replaced",
        when: "Same rotation window",
        body: "We rebook, re-route, arrange medevac and repatriation, or activate a pre-cleared standby contractor in the same discipline — already screened, certified and travel-ready before the call came in.",
      },
      {
        title: "Closed out in writing",
        when: "Within 24 hours",
        body: "A written account of what happened, what it cost, what we changed and who is covering the seat — to your ops team and to the contractor's family where relevant. No silent recovery.",
      },
    ],
    stats: [
      { big: "15 min", small: "Acknowledgement standard — any hour, any day" },
      { big: "24/7", small: "A duty manager reachable, every rotation" },
      { big: "Zero", small: "Escalations left sitting in a voicemail queue" },
    ],
  },

  offices: {
    badge: "Where we work",
    titleLead: "One base,",
    titleAccent: "global reach",
    hubs: [
      {
        tag: "Head Office",
        city: "Tirunelveli, India",
        addr: "Muthu Vinayagar Koil Street, Panagudi",
        desk: "Recruitment & mobilization desk",
        coords: "8.35°N, 77.63°E · GMT+5:30",
      },
    ],
  },

  careers: {
    kicker: "Careers at Energy Talents",
    title: "Join the team behind the crews",
    intro:
      "We hire recruiters who've worked the disciplines they staff — and coordinators who treat every rotation like their own.",
    jobs: [
      {
        where: "Tirunelveli · On-site",
        title: "Senior Recruiter — Drilling & Wells",
        body: "Own the drilling desk. Field experience in wells or rig operations required.",
        href: "/careers",
      },
      {
        where: "Tirunelveli · Hybrid",
        title: "Mobilization Coordinator",
        body: "Run visas, medicals, and travel for offshore rotations across international sectors.",
        href: "/careers",
      },
      {
        where: "Remote · India",
        title: "Compliance Analyst",
        body: "Keep our vetting honest: certification verification and audit tooling.",
        href: "/careers",
      },
    ],
    cta: { text: "View all open roles", href: "/careers" },
  },

  finalCta: {
    title: "Work with us — either side of the desk.",
    body: "Need a crew mobilized, or looking for your next rotation? Both start with the same team.",
    ctaPrimary: { text: "Request Technical Crew", href: "/contact-us" },
    ctaSecondary: { text: "Join the Talent Pool", href: "/careers#pipeline" },
  },
};

/** A fresh, empty slide for the CMS "Add slide" button. */
export function blankStorySlide(): StorySlide {
  return {
    badge: "",
    title: "",
    body: "",
    links: [],
    windowBadge: "",
    panel: "steps",
    steps: [],
    regions: [],
  };
}

/**
 * Fill in anything missing from a stored document.
 *
 * Content saved before a field existed would otherwise reach the page as
 * `undefined`. Merges per section; arrays are replaced wholesale rather than
 * merged element-wise, since that is what an editor means by "these cards".
 */
/**
 * Coerce whatever is stored under `story` into a slide array.
 *
 * Handles the original shape — a fixed `{ mission, deployment }` pair — by
 * converting it to two slides, so documents saved before the carousel became
 * unbounded keep their copy instead of silently reverting to the defaults.
 */
function normalizeStorySlides(story: unknown): StorySlide[] {
  const blank = blankStorySlide();
  const fill = (raw: unknown, fallbackPanel: StorySlidePanel): StorySlide => {
    const o = (raw ?? {}) as Partial<StorySlide>;
    const steps = Array.isArray(o.steps) ? o.steps : [];
    const regions = Array.isArray(o.regions) ? o.regions : [];
    return {
      ...blank,
      ...o,
      links: Array.isArray(o.links) ? o.links : [],
      steps,
      regions,
      // Infer the panel for legacy records, which never stored one.
      panel: o.panel ?? (regions.length && !steps.length ? "regions" : fallbackPanel),
    };
  };

  const s = story as { slides?: unknown; mission?: unknown; deployment?: unknown } | undefined;

  if (Array.isArray(s?.slides)) {
    return s.slides.length
      ? s.slides.map((x) => fill(x, "steps"))
      : DEFAULT_ABOUT_CONTENT.story.slides;
  }

  // Legacy { mission, deployment } document.
  if (s?.mission || s?.deployment) {
    const out: StorySlide[] = [];
    if (s.mission) out.push(fill(s.mission, "steps"));
    if (s.deployment) out.push(fill(s.deployment, "regions"));
    return out;
  }

  return DEFAULT_ABOUT_CONTENT.story.slides;
}

export function withAboutDefaults(value: unknown): AboutPageContent {
  const c = (value ?? {}) as Partial<AboutPageContent>;
  const d = DEFAULT_ABOUT_CONTENT;
  const arr = <T,>(a: unknown, fallback: T[]): T[] =>
    Array.isArray(a) ? (a as T[]) : fallback;

  return {
    hero: { ...d.hero, ...c.hero },
    story: { slides: normalizeStorySlides(c.story) },
    sectors: {
      ...d.sectors,
      ...c.sectors,
      rolesRowOne: arr(c.sectors?.rolesRowOne, d.sectors.rolesRowOne),
      rolesRowTwo: arr(c.sectors?.rolesRowTwo, d.sectors.rolesRowTwo),
    },
    values: { ...d.values, ...c.values, cards: arr(c.values?.cards, d.values.cards) },
    hse: { ...d.hse, ...c.hse, protocols: arr(c.hse?.protocols, d.hse.protocols) },
    crisis: {
      ...d.crisis,
      ...c.crisis,
      steps: arr(c.crisis?.steps, d.crisis.steps),
      stats: arr(c.crisis?.stats, d.crisis.stats),
    },
    offices: { ...d.offices, ...c.offices, hubs: arr(c.offices?.hubs, d.offices.hubs) },
    careers: { ...d.careers, ...c.careers, jobs: arr(c.careers?.jobs, d.careers.jobs) },
    finalCta: { ...d.finalCta, ...c.finalCta },
  };
}
