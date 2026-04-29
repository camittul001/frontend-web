"use client";

import { Amplify } from "aws-amplify";

let configured = false;

// Configure Amplify once on the client. Reads from public env vars so the
// same Cognito pool can be set per-environment in AWS Amplify Hosting.
export function configureAmplify() {
  if (configured) return;
  const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  const userPoolClientId =
    process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID;

  if (!region || !userPoolId || !userPoolClientId) {
    // Fail loudly during dev; in prod Amplify Hosting must inject these.
    throw new Error(
      "Missing Cognito env vars. Set NEXT_PUBLIC_COGNITO_REGION, " +
        "NEXT_PUBLIC_COGNITO_USER_POOL_ID, NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID.",
    );
  }

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId,
          userPoolClientId,
          signUpVerificationMethod: "code",
          loginWith: { email: true },
        },
      },
    },
    { ssr: false },
  );
  configured = true;
}
