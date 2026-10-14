import { auth } from "./auth";
import { redirect } from "next/navigation";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Returns current authenticated session user, or null if not logged in.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  } catch {
    return null;
  }
}

/**
 * Enforces an active user session in Server Components and Server Actions.
 * Redirects unauthenticated requests to /sign-in.
 */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}
