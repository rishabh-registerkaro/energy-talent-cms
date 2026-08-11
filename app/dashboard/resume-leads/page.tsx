"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Eye, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ViewLead from "@/components/common/ViewLead";
import { Lead } from "@/app/types/lead";

/**
 * Resume Builder leads — the paid enquiries from /resume-builder.
 *
 * A separate screen from Leads because these are the revenue ones: they carry a
 * chosen plan, experience level and price, and get lost among crew enquiries in
 * the main table. The API filters on the source prefix rather than this screen
 * filtering a page of results client-side, so pagination and the totals here
 * count only resume leads.
 */

const SOURCE_PREFIX = "Resume Builder";
const PAGE_SIZE = 10;

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Values the resume modal records; read defensively in case one is missing. */
const field = (lead: Lead, key: string) => lead.formData?.[key]?.trim() || "";

export default function ResumeLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  const fetchLeads = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/lead?page=${p}&limit=${PAGE_SIZE}&source=${encodeURIComponent(SOURCE_PREFIX)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setLeads(data.leads || []);
        setPagination(data.pagination ?? null);
      } else {
        toast.error(data.message || "Failed to load resume leads");
      }
    } catch {
      toast.error("Failed to load resume leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page);
  }, [page, fetchLeads]);

  /** Matches the confirm-then-delete flow on the main Leads screen. */
  const handleDelete = (leadId: string) => {
    toast.warning("Are you sure you want to delete this lead?", {
      description: "This action cannot be undone.",
      duration: 6000,
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          const loadingToastId = toast.loading("Deleting lead...");
          try {
            const res = await fetch(`/api/lead/${leadId}`, { method: "DELETE" });
            toast.dismiss(loadingToastId);
            if (res.ok) {
              toast.success("Lead deleted");
              // Deleting the last row of a page would otherwise leave an empty
              // table on a page that no longer exists.
              const isLastOnPage = leads.length === 1 && page > 1;
              if (isLastOnPage) setPage((p) => p - 1);
              else fetchLeads(page);
            } else {
              const data = await res.json().catch(() => null);
              toast.error(data?.message || "Failed to delete lead");
            }
          } catch {
            toast.dismiss(loadingToastId);
            toast.error("Failed to delete lead");
          }
        },
      },
    });
  };

  // Search is client-side over the current page: the leads API has no text
  // search, and adding one is a bigger change than this screen needs.
  const visible = search.trim()
    ? leads.filter((l) => {
        const q = search.toLowerCase();
        return (
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phoneNo.toLowerCase().includes(q) ||
          Object.values(l.formData ?? {}).some((v) =>
            String(v).toLowerCase().includes(q)
          )
        );
      })
    : leads;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Resume Builder Leads</h1>
            <p className="text-slate-400">
              Paid enquiries from <code className="text-indigo-300">/resume-builder</code>,
              with the plan and price each person chose.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchLeads(page)}
            className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw size={15} className="mr-2" />
            Refresh
          </Button>
        </div>

        <Input
          placeholder="Search this page by name, email, phone, plan…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-600 bg-slate-900/60 text-white placeholder-slate-400"
        />

        <div className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-xl">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="whitespace-nowrap text-slate-300">Name/Email</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">Phone</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">Plan</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">Experience</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">Price</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">CV</TableHead>
                <TableHead className="whitespace-nowrap text-slate-300">Created</TableHead>
                <TableHead className="whitespace-nowrap text-center text-slate-300">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-700">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-700" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : visible.length > 0 ? (
                visible.map((lead) => (
                  <TableRow
                    key={lead._id}
                    className="border-slate-700 transition-colors hover:bg-slate-800/30"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-200">{lead.name}</span>
                        <span className="mt-0.5 text-xs text-slate-400">{lead.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-300">
                      {lead.phoneNo}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {field(lead, "Plan") || (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-300">
                      {field(lead, "Experience level") || (
                        <span className="text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-semibold text-slate-100">
                      {field(lead, "Price") || <span className="text-slate-500">—</span>}
                    </TableCell>
                    <TableCell>
                      {lead.attachmentUrl ? (
                        <a
                          href={lead.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={lead.attachmentName || "Open CV"}
                          className="inline-flex items-center gap-1.5 text-sm text-indigo-300 transition-colors hover:text-indigo-200 hover:underline"
                        >
                          <Download className="size-3.5 shrink-0" />
                          View
                        </a>
                      ) : (
                        <span className="text-sm text-slate-500">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-400">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`View ${lead.name}`}
                          onClick={() => setViewLead(lead)}
                          className="text-slate-300 hover:text-white"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete ${lead.name}`}
                          onClick={() => handleDelete(lead._id)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-slate-400">
                    {search.trim()
                      ? "No resume leads on this page match that search."
                      : "No resume-builder leads yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Page {pagination.currentPage} of {pagination.totalPages} ·{" "}
              {pagination.totalCount} lead{pagination.totalCount === 1 ? "" : "s"}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <Dialog open={!!viewLead} onOpenChange={(open) => !open && setViewLead(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-700 bg-slate-900 text-white">
            {viewLead && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">Resume Builder Lead</DialogTitle>
                </DialogHeader>
                <ViewLead lead={viewLead} />
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
