"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, FilePenLine, RefreshCw } from "lucide-react";
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

interface Author {
  _id: string;
  username: string;
}

interface PackageBlock {
  _id: string;
  slug: string;
  title?: string;
  /** Page slugs this block is injected into */
  targetPages?: string[];
  /** Derived server-side — the list never carries the full content JSON */
  tabCount?: number;
  packageCount?: number;
  author: Author;
  status: "draft" | "published";
  /** Frontend on/off switch, independent of status */
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function PackagesPage() {
  const [blocks, setBlocks] = useState<PackageBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  /** Slug of the block whose visibility is mid-flight, to disable its switch */
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchBlocks = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/packages?page=${page}&limit=10`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setBlocks(data.packageBlocks || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch package blocks", { closeButton: true });
      }
    } catch (error) {
      console.error("Error fetching package blocks:", error);
      toast.error("Failed to fetch package blocks", { closeButton: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks(1);
  }, [fetchBlocks]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async (slug: string) => {
    toast.warning("Are you sure you want to delete this package block?", {
      description: "It will be removed from every page it appears on. This cannot be undone.",
      duration: 6000,
      className: "!bg-transparent !text-white !border-gray-200",
      closeButton: true,
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            const res = await fetch(`/api/packages/${slug}`, {
              method: "DELETE",
              credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
              toast.success("Package block deleted successfully!", {
                duration: 3000,
                className: "!bg-transparent !text-white !border-gray-200",
              });
              fetchBlocks(pagination.currentPage);
            } else {
              toast.error(data.message || "Failed to delete package block", {
                duration: 3000,
                className: "!bg-transparent !text-white !border-gray-200",
              });
            }
          } catch (error) {
            console.error("Error deleting package block:", error);
            toast.error("Failed to delete package block");
          }
        },
      },
    });
  };

  // Flip a block on or off the live site without opening the editor. The block
  // keeps its published state; only `visible` changes, and the API clears the
  // cache of every page it targets.
  const handleToggleVisible = async (block: PackageBlock) => {
    const next = block.visible === false;
    setTogglingSlug(block.slug);
    try {
      const res = await fetch(`/api/packages/${block.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ visible: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlocks((prev) =>
          prev.map((b) => (b.slug === block.slug ? { ...b, visible: next } : b))
        );
        toast.success(
          next ? "Block is now showing on the website" : "Block is now hidden from the website",
          { closeButton: true }
        );
      } else {
        toast.error(data.message || "Failed to change visibility", { closeButton: true });
      }
    } catch {
      toast.error("Failed to change visibility", { closeButton: true });
    } finally {
      setTogglingSlug(null);
    }
  };

  const handleRevalidate = async (targetPages: string[] = []) => {
    const toastId = toast.loading("Revalidating cache...");
    try {
      const res = await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: ["package-list", ...targetPages.map((p) => `packages-${p}`)],
        }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Cache cleared — frontend will fetch fresh content", { id: toastId });
      } else {
        toast.error(data.message || "Revalidation failed", { id: toastId });
      }
    } catch {
      toast.error("Revalidation failed", { id: toastId });
    }
  };

  const filteredBlocks = blocks.filter((block) => {
    const haystack = `${block.title ?? ""} ${block.slug} ${(block.targetPages ?? []).join(" ")}`;
    const matchesSearch = haystack.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || block.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Packages</h1>
          <p className="text-slate-400">
            Package blocks are injected into the pages you target — they appear after the
            2nd content section of each page.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, slug or target page..."
                className="w-full bg-slate-900/60 text-white border-slate-600"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-900/60 text-white text-sm"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <Button
              onClick={() => {
                window.location.href = "/dashboard/packages/create-package";
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer whitespace-nowrap"
            >
              Add New Block
            </Button>
          </div>
        </div>

        {/* Blocks Table */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-300">Title / Slug</TableHead>
                <TableHead className="text-slate-300">Appears on</TableHead>
                <TableHead className="text-slate-300">Packages</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">On website</TableHead>
                <TableHead className="text-slate-300">Last Modified</TableHead>
                <TableHead className="text-slate-300 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow
                    key={`skeleton-${index}`}
                    className="border-slate-700 hover:bg-transparent"
                  >
                    <TableCell>
                      <div className="h-5 bg-slate-700 rounded animate-pulse w-3/4"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-12"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-slate-700 rounded-full animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-5 bg-slate-700 rounded-full animate-pulse w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-slate-700 rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-slate-700 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredBlocks.length > 0 ? (
                filteredBlocks.map((block) => {
                  const targets = block.targetPages ?? [];
                  return (
                    <TableRow
                      key={block._id}
                      className="border-slate-700 hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="text-slate-200 font-medium">
                        <div>
                          {block.title || "(no title)"}
                          {block.status === "draft" && (
                            <span className="ml-2 text-xs text-slate-400">- Draft</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{block.slug}</div>
                      </TableCell>
                      <TableCell>
                        {targets.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {targets.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-indigo-500/20 text-indigo-300"
                              >
                                /{p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-400/80">No target pages</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300 text-sm">
                        {block.packageCount ?? 0}
                        <span className="text-slate-500">
                          {" "}
                          in {block.tabCount ?? 0} tab{block.tabCount === 1 ? "" : "s"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            block.status === "published"
                              ? "bg-green-500/20 text-green-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {block.status === "published" ? "Published" : "Draft"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={block.visible !== false}
                          disabled={togglingSlug === block.slug}
                          onClick={() => handleToggleVisible(block)}
                          title={
                            block.visible !== false
                              ? "Showing on the website — click to hide"
                              : "Hidden from the website — click to show"
                          }
                          className="inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 group"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
                              block.visible !== false ? "bg-green-500/70" : "bg-slate-600"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                                block.visible !== false ? "translate-x-4.5" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              block.visible !== false ? "text-green-300" : "text-slate-400"
                            }`}
                          >
                            {block.visible !== false ? "Visible" : "Hidden"}
                          </span>
                        </button>
                        {block.status === "draft" && block.visible !== false && (
                          <div className="text-[11px] text-slate-500 mt-1">
                            Draft — not live either way
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {block.updatedAt
                          ? formatDate(block.updatedAt)
                          : block.createdAt
                          ? formatDate(block.createdAt)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              window.location.href = `/dashboard/packages/update-package?slug=${block.slug}`;
                            }}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 cursor-pointer"
                          >
                            <FilePenLine className="w-4 h-4" />
                          </Button>
                          {block.status === "published" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevalidate(targets)}
                              title="Clear frontend cache for the pages this block appears on"
                              className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/20 cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(block.slug)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/20 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    No package blocks found. Create your first one using the &quot;Add New
                    Block&quot; button.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              <span className="text-sm text-slate-400">
                Page {pagination.currentPage} of {pagination.totalPages} •{" "}
                {pagination.totalCount} blocks
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage || loading}
                  onClick={() => fetchBlocks(pagination.currentPage - 1)}
                  className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-40"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || loading}
                  onClick={() => fetchBlocks(pagination.currentPage + 1)}
                  className="border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-40"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
