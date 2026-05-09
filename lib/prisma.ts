import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { ENV } from "varlock/env";
import { PrismaClient } from "../app/generated/prisma";

export { PrismaClient };

if (!ENV.DATABASE_URL) {
  throw new Error("DATABASE_URL is required but was not provided in ENV.");
}

const connectionString = ENV.DATABASE_URL;

// According to 05-prisma-specs.md:
// - if it starts with prisma+posgres://, use Accelerate
// - otherwise use direct @prisma/adapter-pg
const isAccelerate =
  connectionString.startsWith("prisma+posgres://") ||
  connectionString.startsWith("prisma+postgres://") ||
  connectionString.startsWith("prisma://");

const createPrismaClient = () => {
  if (isAccelerate) {
    return new PrismaClient({ accelerateUrl: connectionString }).$extends(withAccelerate());
  } else {
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
  }
};

// Define a stable type for the database client to avoid union compatibility issues.
// We cast the singleton to the base PrismaClient to ensure standard CRUD operations
// have consistent signatures, while keeping the runtime benefits of extensions.
type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
  prisma: ExtendedPrismaClient | undefined;
};

// Export the singleton. We use the ExtendedPrismaClient type to preserve
// extension functionality (like Accelerate) across the application.
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
