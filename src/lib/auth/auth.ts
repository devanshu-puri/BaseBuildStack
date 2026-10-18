import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";
import { getUserRepository } from "@/lib/db/repositories/user-repo";
import { ProfileRepository } from "@/lib/db/repositories/profile-repo";
import { verifyPassword } from "@/lib/security/password";

// Ensure AUTH_URL is set so Auth.js never defaults to localhost:10000 on reverse proxies
if (!process.env.AUTH_URL) {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const raw = process.env.NEXT_PUBLIC_APP_URL.trim();
    process.env.AUTH_URL = raw.startsWith("http") ? raw : `https://${raw}`;
  } else if (process.env.NODE_ENV === "production") {
    process.env.AUTH_URL = "https://basebuildstack.onrender.com";
  }
}

const providers: Provider[] = [];

if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    })
  );
}

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

// 1. Production Credentials Provider (Email & Password with OWASP scrypt verification)
providers.push(
  Credentials({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email) return null;
      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string | undefined;

      const userRepo = getUserRepository();
      const dbUser = await userRepo.findByEmail(email);

      // If user registered with a password, verify hash using constant-time comparison
      if (dbUser && dbUser.passwordHash) {
        if (!password) return null;
        const isValid = await verifyPassword(password, dbUser.passwordHash);
        if (!isValid) return null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.image || null,
        };
      }

      // If user exists via OAuth without a password
      if (dbUser && !dbUser.passwordHash) {
        return null;
      }

      // Demo/Dev internal accounts
      if (
        email.endsWith("@basebuildstack.internal") ||
        email === "demo@basebuildstack.internal" ||
        process.env.NODE_ENV !== "production"
      ) {
        const safeId = "u_" + email.replace(/[^a-z0-9]/g, "_").slice(0, 32);
        const credRecord = credentials as Record<string, unknown> | undefined;
        return {
          id: safeId,
          name: (credRecord?.name as string) || email.split("@")[0] || "Demo Candidate",
          email,
          image: null,
        };
      }

      return null;
    },
  })
);

// 2. Demo fallback provider for test suites
providers.push(
  Credentials({
    id: "demo",
    name: "Demo / Dev Account",
    credentials: {
      email: { label: "Email", type: "email" },
      name: { label: "Name", type: "text" },
    },
    async authorize(credentials) {
      const email = (credentials?.email as string) || "demo@basebuildstack.internal";
      const name = (credentials?.name as string) || (email.split("@")[0] || "Demo Candidate");
      const safeId = "u_" + email.toLowerCase().replace(/[^a-z0-9]/g, "_").slice(0, 32);
      return {
        id: safeId,
        name,
        email,
        image: null,
      };
    },
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "development_auth_secret_must_be_at_least_32_characters_long",
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // When signing in with OAuth (Google or GitHub), ensure user exists in MongoDB
      if (account && (account.provider === "google" || account.provider === "github") && token.email) {
        try {
          const userRepo = getUserRepository();
          let dbUser = await userRepo.findByEmail(token.email);
          if (!dbUser) {
            const userId = "u_" + globalThis.crypto.randomUUID();
            dbUser = await userRepo.create({
              id: userId,
              email: token.email,
              name: token.name || token.email.split("@")[0],
              image: (token.picture as string) || null,
              role: "user",
              targetRole: "AI Engineer",
              stack: [],
              plan: "free",
              createdAt: new Date(),
            });
            const profileRepo = new ProfileRepository(userId);
            await profileRepo.ensureProfile();
          }
          token.id = dbUser.id;
        } catch {
          // If DB is offline, token.id remains user.id
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
