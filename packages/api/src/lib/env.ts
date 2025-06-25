import type { TypedEnv } from "@based/shared";
import { env } from "cloudflare:workers";

export const typedEnv = env as TypedEnv;
