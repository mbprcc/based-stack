import { env } from "cloudflare:workers";
import { initDbConnection } from "@based/shared/src/lib/db";

export const db = initDbConnection((env as { DB: D1Database }).DB);
