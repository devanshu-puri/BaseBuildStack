import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import type { Provider } from "next-auth/providers";

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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
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
