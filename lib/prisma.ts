import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../app/generated/prisma";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL || "";

// According to 05-prisma-specs.md:
// - if it starts with prisma+posgres://, use Accelerate
// - otherwise use direct @prisma/adapter-pg
const isAccelerate =
	connectionString.startsWith("prisma+posgres://") ||
	connectionString.startsWith("prisma+postgres://") ||
	connectionString.startsWith("prisma://");

const createPrismaClient = () => {
	if (isAccelerate) {
		return new PrismaClient();
	} else {
		const pool = new pg.Pool({ connectionString });
		const adapter = new PrismaPg(pool);
		return new PrismaClient({ adapter });
	}
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = db;
}
