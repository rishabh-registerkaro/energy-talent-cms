"use client";

// About Us page editor. Every card below maps 1:1 to a section of the live
// /about page, in the order it appears there, so what an editor sees here
// matches what they see on the site.

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/components/common/ConfirmDialog";
import {
  ABOUT_ICON_NAMES,
  DEFAULT_ABOUT_CONTENT,
  blankStorySlide,
  withAboutDefaults,
  type AboutPageContent,
  type CtaLink,
  type StorySlidePanel,
} from "@/app/lib/content/about-content";

/* ------------------------------- primitives ------------------------------ */

const inputCls =
  "w-full border border-slate-600 bg-slate-800 text-slate-200 placeholder-slate-400";
const labelCls = "block text-sm font-medium text-slate-200 mb-2";
const itemCls = "border border-slate-600 bg-slate-900 p-4 space-y-3";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input
        className={inputCls}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea
        className={inputCls}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </Field>
  );
}

/** Text + href pair, used by every CTA on the page. */
function LinkPair({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CtaLink;
  onChange: (v: CtaLink) => void;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          className={inputCls}
          value={value?.text ?? ""}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Button text"
        />
        <Input
          className={inputCls}
          value={value?.href ?? ""}
          onChange={(e) => onChange({ ...value, href: e.target.value })}
          placeholder="/careers or #section"
        />
      </div>
    </div>
  );
}

/** Collapsible section wrapper. */
function Section({
  n,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  n: string;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 border border-slate-700 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              {n}
            </span>
            <span className="text-lg font-semibold text-slate-100">{title}</span>
          </span>
          <span className="mt-1 block pl-10 text-sm text-slate-400">{subtitle}</span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-5 border-t border-slate-700 p-5">{children}</div>}
    </div>
  );
}

/**
 * Generic add / remove / reorder list.
 * `renderItem` receives the item plus a patcher, so callers stay declarative.
 */
function Repeater<T>({
  label,
  items,
  onChange,
  blank,
  itemLabel,
  renderItem,
  hint,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  blank: () => T;
  itemLabel: string;
  renderItem: (item: T, patch: (p: Partial<T>) => void, index: number) => React.ReactNode;
  hint?: string;
}) {
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <label className={labelCls}>
        {label} ({items.length})
      </label>
      {hint && <p className="-mt-2 text-xs text-slate-400">{hint}</p>}

      {items.map((item, i) => (
        <div key={i} className={itemCls}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {itemLabel} {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Move up"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
                className="p-1.5 text-slate-400 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Remove"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                className="p-1.5 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {renderItem(
            item,
            (p) => onChange(items.map((x, idx) => (idx === i ? { ...x, ...p } : x))),
            i
          )}
        </div>
      ))}

      <Button
        variant="outline"
        onClick={() => onChange([...items, blank()])}
        className="border-slate-600 text-slate-200"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

/** Flat list of plain strings — the marquee role chips. */
function StringList({
  label,
  items,
  onChange,
  hint,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className={labelCls}>
        {label} ({items.length})
      </label>
      {hint && <p className="-mt-1 text-xs text-slate-400">{hint}</p>}
      {items.map((v, i) => (
        <div key={i} className="flex gap-2">
          <Input
            className={inputCls}
            value={v}
            onChange={(e) => onChange(items.map((x, idx) => (idx === i ? e.target.value : x)))}
          />
          <Button
            variant="outline"
            size="sm"
            aria-label="Remove"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            className="shrink-0 border-red-500/40 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        onClick={() => onChange([...items, ""])}
        className="border-slate-600 text-slate-200"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add item
      </Button>
    </div>
  );
}

const BREAK_HINT = "Press Enter for a line break — the site keeps it.";

/* -------------------------------- the page ------------------------------- */

export default function AboutPageEditor() {
  const confirm = useConfirm();
  const [content, setContent] = useState<AboutPageContent>(DEFAULT_ABOUT_CONTENT);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ hero: true });

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  /** Patch one top-level section. */
  const set = <K extends keyof AboutPageContent>(
    key: K,
    patch: Partial<AboutPageContent[K]>
  ) => setContent((c) => ({ ...c, [key]: { ...c[key], ...patch } }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/about", { credentials: "include" });
      const json = await res.json();
      const row = json?.aboutPage ?? json?.data;
      // Merge over the defaults so a document saved before a field existed
      // still opens with every input populated.
      setContent(withAboutDefaults(row?.content));
      setMetaTitle(row?.metaTitle ?? "");
      setMetaDescription(row?.metaDescription ?? "");
    } catch {
      // Nothing saved yet, or the CMS is cold. The defaults are already in
      // state, and they are exactly what the live page renders.
      setContent(DEFAULT_ABOUT_CONTENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving About page...");
    try {
      const res = await fetch("/api/about", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, metaTitle, metaDescription }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message ?? "Save failed");
      toast.dismiss(toastId);
      toast.success("About page saved", { closeButton: true });
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Something went wrong", {
        closeButton: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    const ok = await confirm({
      title: "Reset every field to the default copy?",
      description:
        "This refills the form with the text the page shipped with. Nothing is published until you press Save Page.",
      confirmLabel: "Reset fields",
      tone: "warning",
    });
    if (!ok) return;
    setContent(DEFAULT_ABOUT_CONTENT);
    toast.success("Fields reset — press Save Page to publish", { closeButton: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-900 p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-9 w-64 animate-pulse bg-muted" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse border border-slate-700 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  const { hero, story, sectors, values, hse, crisis, offices, careers, finalCta } = content;

  return (
    <div className="min-h-screen w-full bg-slate-900 p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="mb-1 text-3xl font-bold text-slate-100">About Us Page</h1>
            <p className="text-slate-400">
              Every section of the live /about page, in the order it appears.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} className="border-slate-600 text-slate-200">
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload
            </Button>
            <Button variant="outline" onClick={reset} className="border-slate-600 text-slate-200">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset fields
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-indigo-500 text-white hover:bg-indigo-600"
            >
              {saving ? "Saving..." : "Save Page"}
            </Button>
          </div>
        </div>

        {/* SEO */}
        <Section
          n="—"
          title="SEO / Meta"
          subtitle="Browser tab title and search-result description"
          open={!!open.seo}
          onToggle={() => toggle("seo")}
        >
          <Text
            label="Meta title"
            value={metaTitle}
            onChange={setMetaTitle}
            placeholder="About Us"
          />
          <Area label="Meta description" value={metaDescription} onChange={setMetaDescription} />
        </Section>

        {/* 1 — Hero */}
        <Section
          n="1"
          title="Hero"
          subtitle="Pill badge, headline, intro and the two buttons"
          open={!!open.hero}
          onToggle={() => toggle("hero")}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Badge — light text"
              value={hero.badgePrefix}
              onChange={(v) => set("hero", { badgePrefix: v })}
              placeholder="India-based"
            />
            <Text
              label="Badge — bold text"
              value={hero.badgeStrong}
              onChange={(v) => set("hero", { badgeStrong: v })}
              placeholder="Energy crewing specialists"
            />
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Text
              label="Headline — start"
              value={hero.titleLead}
              onChange={(v) => set("hero", { titleLead: v })}
            />
            <Text
              label="Headline — orange part"
              value={hero.titleAccent}
              onChange={(v) => set("hero", { titleAccent: v })}
            />
            <Text
              label="Headline — end"
              value={hero.titleTail}
              onChange={(v) => set("hero", { titleTail: v })}
            />
          </div>
          <Area
            label="Intro paragraph"
            value={hero.subtitle}
            onChange={(v) => set("hero", { subtitle: v })}
          />
          <LinkPair
            label="Primary button"
            value={hero.ctaPrimary}
            onChange={(v) => set("hero", { ctaPrimary: v })}
          />
          <LinkPair
            label="Secondary button"
            value={hero.ctaSecondary}
            onChange={(v) => set("hero", { ctaSecondary: v })}
          />
        </Section>

        {/* 2 — Story carousel */}
        <Section
          n="2"
          title="Story carousel"
          subtitle="Auto-rotating slides — add as many as you like"
          open={!!open.story}
          onToggle={() => toggle("story")}
        >
          <Repeater
            label="Slides"
            itemLabel="Slide"
            hint="Each slide has a text column on the left and a mock browser panel on the right. Arrows, dots and auto-advance all adapt to the number of slides."
            items={story.slides}
            onChange={(slides) => set("story", { slides })}
            blank={blankStorySlide}
            renderItem={(slide, patch) => (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Badge</label>
                    <Input
                      className={inputCls}
                      value={slide.badge}
                      onChange={(e) => patch({ badge: e.target.value })}
                      placeholder="Our Mission"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">
                      Browser-chrome pill
                    </label>
                    <Input
                      className={inputCls}
                      value={slide.windowBadge}
                      onChange={(e) => patch({ windowBadge: e.target.value })}
                      placeholder="How we work"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Heading</label>
                  <Textarea
                    className={inputCls}
                    rows={2}
                    value={slide.title}
                    onChange={(e) => patch({ title: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-400">{BREAK_HINT}</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Body</label>
                  <Textarea
                    className={inputCls}
                    rows={3}
                    value={slide.body}
                    onChange={(e) => patch({ body: e.target.value })}
                  />
                </div>

                <Repeater
                  label="Buttons"
                  itemLabel="Button"
                  hint="The first is solid white; the rest are outlined."
                  items={slide.links}
                  onChange={(links) => patch({ links })}
                  blank={() => ({ text: "", href: "" })}
                  renderItem={(l, lp) => (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Input
                        className={inputCls}
                        value={l.text}
                        onChange={(e) => lp({ text: e.target.value })}
                        placeholder="Button text"
                      />
                      <Input
                        className={inputCls}
                        value={l.href}
                        onChange={(e) => lp({ href: e.target.value })}
                        placeholder="#values"
                      />
                    </div>
                  )}
                />

                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">
                    Right-hand panel
                  </label>
                  <Select
                    value={slide.panel}
                    onValueChange={(v) => patch({ panel: v as StorySlidePanel })}
                  >
                    <SelectTrigger className={inputCls}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="steps" className="cursor-pointer">
                        Numbered steps
                      </SelectItem>
                      <SelectItem value="regions" className="cursor-pointer">
                        Region cards
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-slate-400">
                    Switching keeps the other list, so nothing is lost.
                  </p>
                </div>

                {slide.panel === "steps" ? (
                  <Repeater
                    label="Steps"
                    itemLabel="Step"
                    hint="Numbered 01, 02, 03… automatically."
                    items={slide.steps}
                    onChange={(steps) => patch({ steps })}
                    blank={() => ({ title: "", body: "" })}
                    renderItem={(st, sp) => (
                      <>
                        <Input
                          className={inputCls}
                          value={st.title}
                          onChange={(e) => sp({ title: e.target.value })}
                          placeholder="Step title — e.g. Source"
                        />
                        <Textarea
                          className={inputCls}
                          rows={2}
                          value={st.body}
                          onChange={(e) => sp({ body: e.target.value })}
                        />
                      </>
                    )}
                  />
                ) : (
                  <Repeater
                    label="Region cards"
                    itemLabel="Region"
                    items={slide.regions}
                    onChange={(regions) => patch({ regions })}
                    blank={() => ({ tag: "Region", city: "", desk: "" })}
                    renderItem={(r, rp) => (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input
                          className={inputCls}
                          value={r.tag}
                          onChange={(e) => rp({ tag: e.target.value })}
                          placeholder="Label — Region"
                        />
                        <Input
                          className={inputCls}
                          value={r.city}
                          onChange={(e) => rp({ city: e.target.value })}
                          placeholder="Middle East & Africa"
                        />
                        <Input
                          className={inputCls}
                          value={r.desk}
                          onChange={(e) => rp({ desk: e.target.value })}
                          placeholder="Upstream, downstream & EPC"
                        />
                      </div>
                    )}
                  />
                )}
              </div>
            )}
          />
        </Section>


        {/* 3 — Sectors */}
        <Section
          n="3"
          title="Every technical role"
          subtitle="Heading, intro, the two scrolling role rows and the CTA"
          open={!!open.sectors}
          onToggle={() => toggle("sectors")}
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Heading — orange line"
              value={sectors.titleAccent}
              onChange={(v) => set("sectors", { titleAccent: v })}
            />
            <Text
              label="Heading — second line"
              value={sectors.titleRest}
              onChange={(v) => set("sectors", { titleRest: v })}
            />
          </div>
          <Area
            label="Intro paragraph"
            value={sectors.subtitle}
            onChange={(v) => set("sectors", { subtitle: v })}
          />
          <StringList
            label="Role chips — top row (scrolls left)"
            hint="Duplicated automatically so the marquee loops seamlessly."
            items={sectors.rolesRowOne}
            onChange={(rolesRowOne) => set("sectors", { rolesRowOne })}
          />
          <StringList
            label="Role chips — bottom row (scrolls right)"
            items={sectors.rolesRowTwo}
            onChange={(rolesRowTwo) => set("sectors", { rolesRowTwo })}
          />
          <LinkPair label="Button" value={sectors.cta} onChange={(cta) => set("sectors", { cta })} />
        </Section>

        {/* 4 — Values */}
        <Section
          n="4"
          title="Values"
          subtitle="Badge, heading and the value cards"
          open={!!open.values}
          onToggle={() => toggle("values")}
        >
          <Text label="Badge" value={values.badge} onChange={(v) => set("values", { badge: v })} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Heading — first line"
              value={values.titleLead}
              onChange={(v) => set("values", { titleLead: v })}
            />
            <Text
              label="Heading — orange line"
              value={values.titleAccent}
              onChange={(v) => set("values", { titleAccent: v })}
            />
          </div>
          <Repeater
            label="Value cards"
            itemLabel="Value"
            hint="Numbered 01, 02, 03… automatically."
            items={values.cards}
            onChange={(cards) => set("values", { cards })}
            blank={() => ({ icon: "IconShield", title: "", body: "", proofLead: "", proof: "" })}
            renderItem={(card, patch) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Icon</label>
                    <Select value={card.icon} onValueChange={(v) => patch({ icon: v })}>
                      <SelectTrigger className={inputCls}>
                        <SelectValue placeholder="Pick an icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ABOUT_ICON_NAMES.map((n) => (
                          <SelectItem key={n} value={n} className="cursor-pointer">
                            {n.replace("Icon", "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Title</label>
                    <Input
                      className={inputCls}
                      value={card.title}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </div>
                </div>
                <Textarea
                  className={inputCls}
                  rows={3}
                  value={card.body}
                  onChange={(e) => patch({ body: e.target.value })}
                  placeholder="Card body"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr]">
                  <Input
                    className={inputCls}
                    value={card.proofLead}
                    onChange={(e) => patch({ proofLead: e.target.value })}
                    placeholder="Footer label — HSE-first"
                  />
                  <Input
                    className={inputCls}
                    value={card.proof}
                    onChange={(e) => patch({ proof: e.target.value })}
                    placeholder="Footer text"
                  />
                </div>
              </>
            )}
          />
        </Section>

        {/* 5 — HSE */}
        <Section
          n="5"
          title="Operational HSE"
          subtitle="Kicker, heading, intro and the protocol tiles"
          open={!!open.hse}
          onToggle={() => toggle("hse")}
        >
          <Text label="Kicker" value={hse.kicker} onChange={(v) => set("hse", { kicker: v })} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Heading — plain part"
              value={hse.titleLead}
              onChange={(v) => set("hse", { titleLead: v })}
            />
            <Text
              label="Heading — orange part"
              value={hse.titleAccent}
              onChange={(v) => set("hse", { titleAccent: v })}
            />
          </div>
          <Area label="Intro" value={hse.intro} onChange={(v) => set("hse", { intro: v })} />
          <Text
            label="Tile label"
            value={hse.protocolLabel}
            onChange={(v) => set("hse", { protocolLabel: v })}
            hint='Shown before the number, e.g. "Protocol 01".'
          />
          <Repeater
            label="Protocol tiles"
            itemLabel="Protocol"
            hint="Numbered automatically."
            items={hse.protocols}
            onChange={(protocols) => set("hse", { protocols })}
            blank={() => ({ title: "", body: "" })}
            renderItem={(p, patch) => (
              <>
                <Input
                  className={inputCls}
                  value={p.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Protocol title"
                />
                <Textarea
                  className={inputCls}
                  rows={3}
                  value={p.body}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </>
            )}
          />
        </Section>

        {/* 6 — Crisis */}
        <Section
          n="6"
          title="Crisis management"
          subtitle="The escalation timeline and the three stats below it"
          open={!!open.crisis}
          onToggle={() => toggle("crisis")}
        >
          <Text label="Kicker" value={crisis.kicker} onChange={(v) => set("crisis", { kicker: v })} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Heading — plain part"
              value={crisis.titleLead}
              onChange={(v) => set("crisis", { titleLead: v })}
            />
            <Text
              label="Heading — orange part"
              value={crisis.titleAccent}
              onChange={(v) => set("crisis", { titleAccent: v })}
            />
          </div>
          <Area label="Intro" value={crisis.intro} onChange={(v) => set("crisis", { intro: v })} />
          <Repeater
            label="Timeline steps"
            itemLabel="Step"
            hint="Numbered 01, 02, 03… automatically."
            items={crisis.steps}
            onChange={(steps) => set("crisis", { steps })}
            blank={() => ({ title: "", when: "", body: "" })}
            renderItem={(s, patch) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    className={inputCls}
                    value={s.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Step title"
                  />
                  <Input
                    className={inputCls}
                    value={s.when}
                    onChange={(e) => patch({ when: e.target.value })}
                    placeholder="Orange sub-label — Within 15 minutes"
                  />
                </div>
                <Textarea
                  className={inputCls}
                  rows={3}
                  value={s.body}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </>
            )}
          />
          <Repeater
            label="Stats strip"
            itemLabel="Stat"
            items={crisis.stats}
            onChange={(stats) => set("crisis", { stats })}
            blank={() => ({ big: "", small: "" })}
            renderItem={(s, patch) => (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
                <Input
                  className={inputCls}
                  value={s.big}
                  onChange={(e) => patch({ big: e.target.value })}
                  placeholder="15 min"
                />
                <Input
                  className={inputCls}
                  value={s.small}
                  onChange={(e) => patch({ small: e.target.value })}
                  placeholder="Description"
                />
              </div>
            )}
          />
        </Section>

        {/* 7 — Offices */}
        <Section
          n="7"
          title="Where we work"
          subtitle="Badge, heading and the office cards"
          open={!!open.offices}
          onToggle={() => toggle("offices")}
        >
          <Text label="Badge" value={offices.badge} onChange={(v) => set("offices", { badge: v })} />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Text
              label="Heading — plain part"
              value={offices.titleLead}
              onChange={(v) => set("offices", { titleLead: v })}
            />
            <Text
              label="Heading — orange part"
              value={offices.titleAccent}
              onChange={(v) => set("offices", { titleAccent: v })}
            />
          </div>
          <Repeater
            label="Offices"
            itemLabel="Office"
            items={offices.hubs}
            onChange={(hubs) => set("offices", { hubs })}
            blank={() => ({ tag: "Office", city: "", addr: "", desk: "", coords: "" })}
            renderItem={(h, patch) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    className={inputCls}
                    value={h.tag}
                    onChange={(e) => patch({ tag: e.target.value })}
                    placeholder="Label — Head Office"
                  />
                  <Input
                    className={inputCls}
                    value={h.city}
                    onChange={(e) => patch({ city: e.target.value })}
                    placeholder="Tirunelveli, India"
                  />
                </div>
                <Input
                  className={inputCls}
                  value={h.addr}
                  onChange={(e) => patch({ addr: e.target.value })}
                  placeholder="Street address"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    className={inputCls}
                    value={h.desk}
                    onChange={(e) => patch({ desk: e.target.value })}
                    placeholder="Recruitment & mobilization desk"
                  />
                  <Input
                    className={inputCls}
                    value={h.coords}
                    onChange={(e) => patch({ coords: e.target.value })}
                    placeholder="8.35°N, 77.63°E · GMT+5:30"
                  />
                </div>
              </>
            )}
          />
        </Section>

        {/* 8 — Careers */}
        <Section
          n="8"
          title="Careers at Energy Talents"
          subtitle="Internal vacancies shown on this page"
          open={!!open.careers}
          onToggle={() => toggle("careers")}
        >
          <Text
            label="Kicker"
            value={careers.kicker}
            onChange={(v) => set("careers", { kicker: v })}
          />
          <Text label="Heading" value={careers.title} onChange={(v) => set("careers", { title: v })} />
          <Area label="Intro" value={careers.intro} onChange={(v) => set("careers", { intro: v })} />
          <Repeater
            label="Job cards"
            itemLabel="Job"
            items={careers.jobs}
            onChange={(jobs) => set("careers", { jobs })}
            blank={() => ({ where: "", title: "", body: "", href: "/careers" })}
            renderItem={(j, patch) => (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    className={inputCls}
                    value={j.where}
                    onChange={(e) => patch({ where: e.target.value })}
                    placeholder="Badge — Tirunelveli · On-site"
                  />
                  <Input
                    className={inputCls}
                    value={j.href}
                    onChange={(e) => patch({ href: e.target.value })}
                    placeholder="Link — /careers"
                  />
                </div>
                <Input
                  className={inputCls}
                  value={j.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Job title"
                />
                <Textarea
                  className={inputCls}
                  rows={2}
                  value={j.body}
                  onChange={(e) => patch({ body: e.target.value })}
                />
              </>
            )}
          />
          <LinkPair label="Button" value={careers.cta} onChange={(cta) => set("careers", { cta })} />
        </Section>

        {/* 9 — Final CTA */}
        <Section
          n="9"
          title="Final CTA banner"
          subtitle="The orange gradient block at the bottom"
          open={!!open.finalCta}
          onToggle={() => toggle("finalCta")}
        >
          <Area
            label="Heading"
            rows={2}
            value={finalCta.title}
            onChange={(v) => set("finalCta", { title: v })}
          />
          <Area label="Body" value={finalCta.body} onChange={(v) => set("finalCta", { body: v })} />
          <LinkPair
            label="Primary button"
            value={finalCta.ctaPrimary}
            onChange={(v) => set("finalCta", { ctaPrimary: v })}
          />
          <LinkPair
            label="Secondary button"
            value={finalCta.ctaSecondary}
            onChange={(v) => set("finalCta", { ctaSecondary: v })}
          />
        </Section>

        <div className="flex justify-end pb-10">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-indigo-500 text-white hover:bg-indigo-600"
          >
            {saving ? "Saving..." : "Save Page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
