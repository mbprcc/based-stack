import { API_BASE_URL } from "@based/shared";
import type { SharedAuth } from "@based/shared/src/lib/auth";
import { createAuthClient } from "better-auth/client";
import { emailOTPClient, inferAdditionalFields, rolesClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    plugins: [emailOTPClient(), inferAdditionalFields<SharedAuth>(), rolesClient()],
    baseURL: API_BASE_URL,
});
