import { defineConfig } from "prisma/config";
import { ENV } from "varlock/env";

export default defineConfig({
	schema: "prisma/",
	migrations: {
		path: "prisma/migrations",
	},
	datasource: {
		url: ENV.DATABASE_URL,
	},
});
