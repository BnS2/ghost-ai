import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";
import { ENV } from "varlock/env";
import { PrismaClient } from "../app/generated/prisma";

const connectionString = ENV.DATABASE_URL || "";

// According to 05-prisma-specs.md:
// - if it starts with prisma+posgres://, use Accelerate
// - otherwise use direct @prisma/adapter-pg
const isAccelerate =
	connectionString.startsWith("prisma+posgres://") ||
	connectionString.startsWith("prisma+postgres://") ||
	connectionString.startsWith("prisma://");

const createPrismaClient = () => {
	if (isAccelerate) {
		return new PrismaClient({ accelerateUrl: connectionString }).$extends(
			withAccelerate(),
		);
	} else {
		const adapter = new PrismaPg({ connectionString });
		return new PrismaClient({ adapter });
	}
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as {
	prisma: ExtendedPrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (ENV.NODE_ENV !== "production") {
	globalForPrisma.prisma = db as ExtendedPrismaClient;
}
