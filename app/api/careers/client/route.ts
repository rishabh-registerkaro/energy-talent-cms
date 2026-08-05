import prisma from "@/app/lib/config/db";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCorsHeaders } from "@/app/lib/utils/cors";
import { apiErrorResponse } from "@/app/lib/utils/apiError";
import {
  CAREER_CATEGORIES,
  daysSince,
  postedLabel,
} from "@/app/lib/constants/career";

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(req.headers.get("origin")) });
}

/**
 * Public roles listing for the frontend /careers page.
 *
 * Returns the exact shape of the `Role` type the frontend already uses
 * (EnergyTalents/app/careers/roles-data.ts), so this endpoint is a drop-in
 * replacement for that static array — including the derived `posted` label and
 * `days` sort key.
 *
 * Query params mirror the on-page controls: ?category= &type= &q= &featured=
 * &sort=newest|oldest &limit=
 */
export async function GET(req: NextRequest) {
  const headers = getCorsHeaders(req.headers.get("origin"));
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const q = searchParams.get("q")?.trim() || "";
    const featured = searchParams.get("featured")?.trim() || "";
    const sort = searchParams.get("sort") === "oldest" ? "asc" : "desc";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(200, Math.max(1, parseInt(limitParam, 10))) : undefined;

    const where: Prisma.CareerWhereInput = { status: "published" };

    // "All roles" is the frontend's default tab and is not a stored value.
    if (category && category !== "All roles") where.category = category;
    if (type) where.type = type;
    if (featured === "true") where.featured = true;

    // Match the frontend's behaviour: every whitespace-separated term must
    // appear somewhere in the role's searchable fields.
    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      where.AND = terms.map((t) => ({
        OR: [
          { title: { contains: t } },
          { location: { contains: t } },
          { category: { contains: t } },
          { type: { contains: t } },
          { duration: { contains: t } },
        ],
      }));
    }

    const careers = await prisma.career.findMany({
      where,
      orderBy: [{ publishedAt: sort }, { createdAt: sort }],
      ...(limit ? { take: limit } : {}),
      select: {
        slug: true,
        title: true,
        category: true,
        location: true,
        type: true,
        duration: true,
        salary: true,
        unit: true,
        featured: true,
        summary: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const roles = careers.map((c) => {
      const posted = c.publishedAt ?? c.createdAt;
      return {
        slug: c.slug,
        title: c.title,
        category: c.category,
        location: c.location,
        type: c.type,
        duration: c.duration,
        salary: c.salary,
        unit: c.unit,
        featured: c.featured,
        summary: c.summary,
        posted: postedLabel(posted),
        days: daysSince(posted),
      };
    });

    return NextResponse.json(
      {
        success: true,
        roles,
        // Only disciplines that actually have live roles, so the frontend can
        // build its tabs without shipping empty ones.
        filters: {
          categories: CAREER_CATEGORIES.filter((cat) =>
            careers.some((c) => c.category === cat)
          ),
          types: [...new Set(careers.map((c) => c.type))],
          locations: [...new Set(careers.map((c) => c.location))].sort(),
        },
        total: roles.length,
      },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Failed to fetch public careers", error);
    const res = apiErrorResponse(error, "Failed to fetch careers.");
    Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
