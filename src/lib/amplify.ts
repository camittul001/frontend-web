"use client";

import { Amplify } from "aws-amplify";

let configured = false;
let missingVars: string[] = [];

// Configure Amplify once on the client. Reads from public env vars so the
// same Cognito pool can be set per-environment in AWS Amplify Hosting.
// Returns the list of missing env vars (empty array on success) instead of
// throwing, so the UI can render a clear message instead of a white screen.
export function configureAmplify(): string[] {
  if (configured) return [];
  const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId =
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const missing: string[] = [];
  if (!region) missing.push("NEXT_PUBLIC_COGNITO_REGION");
  if (!userPoolId) missing.push("NEXT_PUBLIC_COGNITO_USER_POOL_ID");
  if (!userPoolClientId) missing.push("NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID");
  if (!apiBaseUrl) missing.push("NEXT_PUBLIC_API_BASE_URL");

  if (missing.length > 0) {
    missingVars = missing;
    if (typeof console !== "undefined") {
      console.error(
        "A2N: missing env vars — set these in AWS Amplify Hosting and redeploy:",
        missing,
      );
    }
    return missing;
  }

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: userPoolId as string,
          userPoolClientId: userPoolClientId as string,
          signUpVerificationMethod: "code",
          loginWith: { email: true },
        },
      },
    },
    { ssr: false },
  );
  configured = true;
  return [];
}

export function getMissingEnvVars(): string[] {
  return missingVars;
}

