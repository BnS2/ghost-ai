import { Liveblocks } from "@liveblocks/node";

const COLORS = [
  "#e11d48", // rose-600
  "#d97706", // amber-600
  "#16a34a", // green-600
  "#0284c7", // sky-600
  "#4f46e5", // indigo-600
  "#9333ea", // purple-600
  "#c026d3", // fuchsia-600
  "#0d9488", // teal-600
];

const createLiveblocksClient = () => {
  return new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dev_dummy",
  });
};

const globalForLiveblocks = global as unknown as {
  liveblocks: ReturnType<typeof createLiveblocksClient> | undefined;
};

export const liveblocks = globalForLiveblocks.liveblocks ?? createLiveblocksClient();

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}

export function getUserColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}
