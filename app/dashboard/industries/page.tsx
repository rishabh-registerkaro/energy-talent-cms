"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Industry sectors — the four /industry/<slug> pages.
 *
 * They are stored as ServicePages with template "industry", so they reuse the
 * section editor, but the Services list filters to division pages and would
 * otherwise leave them unreachable. A fixed set of four gets a list rather
 * than a create form: each is tied to a photograph and a slot in the home
 * page's sector row, so adding one is a code change.
 */

const INDUSTRY_TEMPLATE = "industry";

/** Kept in step with the frontend's app/industry/industries.ts. */
const SLUGS = [
  "renewable-power",
  "oil-and-gas",
  "infrastructure-and-civil",
  "maritime-and-offshore",
] as const;

type Row = {
  slug: string;
  title: string;
  status: string;
  updatedAt: string | null;
  found: boolean;
};

export default function IndustriesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        SLUGS.map(async (slug) => {
          try {
            const res = await fetch(`/api/services/${slug}`, {
              credentials: "include",
            });
            const data = await res.json();
            const page = res.ok ? data.data : null;
            return {
              slug,
              title: page?.content?.titleLead || slug,
              status: page?.status ?? "missing",
              updatedAt: page?.updatedAt ?? null,
              found: !!page && page.template === INDUSTRY_TEMPLATE,
            };
          } catch {
            return { slug, title: slug, status: "missing", updatedAt: null, found: false };
          }
        })
      );
      setRows(results);
    } catch {
      toast.error("Failed to load industry sectors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Industry Sectors</h1>
            <p className="text-slate-400">
              The four sector pages linked from the home page.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={load}
            className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
        </div>

        <div className="border border-[var(--et-orange)]/35 bg-[var(--et-orange-soft)] px-4 py-3">
          <p className="text-sm leading-relaxed text-[var(--et-ink-2)]">
            <strong className="font-semibold text-[var(--et-orange-strong)]">
              What you can change:
            </strong>{" "}
            the sector name, its one-line description, the write-up and the list
            of disciplines. The photograph and which jobs appear are fixed in
            code — the roles come from Careers, by category. Keep the{" "}
            <code className="bg-white px-1 py-0.5 text-[13px] text-[var(--et-ink)]">
              overview
            </code>{" "}
            and{" "}
            <code className="bg-white px-1 py-0.5 text-[13px] text-[var(--et-ink)]">
              supplies
            </code>{" "}
            section ids as they are, or those blocks disappear from the site.
          </p>
        </div>

        <div className="space-y-3">
          {loading
            ? SLUGS.map((s) => (
                <div
                  key={s}
                  className="h-20 animate-pulse rounded-xl border border-slate-700/80 bg-slate-800/40"
                />
              ))
            : rows.map((row) => (
                <div
                  key={row.slug}
                  className="flex flex-col gap-3 rounded-xl border border-slate-700/80 bg-slate-800/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-white">
                        {row.title}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "published"
                            ? "bg-green-500/20 text-green-300"
                            : row.status === "missing"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-300"
                        }`}
                      >
                        {row.status === "missing" ? "Not created" : row.status}
                      </span>
                    </div>
                    <code className="mt-1 block truncate text-xs text-slate-400">
                      /industry/{row.slug}
                    </code>
                  </div>

                  {row.found ? (
                    <Button
                      asChild
                      className="bg-indigo-500 text-white hover:bg-indigo-600"
                    >
                      <Link
                        href={`/dashboard/services/update-service?slug=${row.slug}`}
                      >
                        <Pencil size={15} className="mr-2" />
                        Edit
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-sm text-slate-500">
                      Missing — the site is showing its built-in copy
                    </span>
                  )}
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
