// One-off seeder: fills the About page singleton with the content currently
// hardcoded in the Energy Talent frontend. Safe to re-run — overwrites.
//
//   npx tsx prisma/seed-about.ts

import { PrismaClient, Prisma } from "@prisma/client";
import { DEFAULT_ABOUT_CONTENT } from "../app/lib/content/about-content";

const prisma = new PrismaClient();

async function withRetry<T>(label: string, fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt >= tries || !msg.includes("Can't reach database server")) throw err;
      console.log(`  ${label}: connection dropped, retrying (${attempt}/${tries})…`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const data = {
    metaTitle: "About Us",
    metaDescription:
      "Energy crewing specialists based in Tamil Nadu, India. We recruit, vet and mobilize skilled technical crews to energy projects worldwide — and stay reachable when a rotation goes sideways.",
    content: DEFAULT_ABOUT_CONTENT as unknown as Prisma.InputJsonValue,
  };
  await withRetry("about page", async () => {
    const existing = await prisma.aboutPage.findFirst();
    return existing
      ? prisma.aboutPage.update({ where: { id: existing.id }, data })
      : prisma.aboutPage.create({ data });
  });
  console.log("✔ about page seeded");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
