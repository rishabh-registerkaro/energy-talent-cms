/**
 * CORS headers for the public `/client` endpoints the frontend reads.
 *
 * Same policy the existing service/post client routes implement inline; pulled
 * out here so new public routes don't each carry their own copy of it.
 * Allows the configured production frontend, plus any localhost port for dev.
 */
export const getCorsHeaders = (origin: string | null) => {
  const PRODUCTION_URL =
    process.env.PRODUCTION_URL || "https://energy-talent-cms-coral.vercel.app";

  const allowOrigin =
    origin && origin.startsWith("http://localhost:") ? origin : PRODUCTION_URL;

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
};
