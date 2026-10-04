import { createAuthClient } from "better-auth/react";
import { adminClient, emailOTPClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  plugins: [adminClient(), emailOTPClient()],
});

export const { useSession, signIn, signUp, signOut, updateUser } = authClient;
export const { admin } = authClient;
