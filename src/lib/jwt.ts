import { JWTPayload, SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || process.env.AUTH_JWT_SECRET || "dev-secret"
);

export type AppSession = JWTPayload & {
  sub: string; // user id
  email: string;
  username?: string | null;
  role?: string | null;
  permissions?: string[];
  jti?: string; // unique session id for revocation
  employee?: {
    id?: number | null;
    full_name?: string | null;
    department?: string | null;
    position?: string | null;
    employment_status?: string | null;
  } | null;
  last_login_at?: string | null;
};

export async function signAppJWT(payload: AppSession, expiresInSeconds = 60 * 60 * 12) {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(secret);
}

export async function verifyAppJWT(token: string): Promise<AppSession> {
  const { payload } = await jwtVerify(token, secret);
  return payload as AppSession;
}
