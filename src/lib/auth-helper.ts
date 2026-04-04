import { auth } from "./auth";
import { prisma } from "./prisma";
import { NextRequest } from "next/server";

/**
 * Retrieves the fully authenticated user from the database based on the active session.
 * This verifies the session against the actual database table to ensure permissions 
 * are real-time and the user account is still active.
 */
export async function getSessionUser(request?: NextRequest) {
  try {
    // 1. Get the session using NextAuth v5 auth()
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return null;
    }

    // 2. Query the database directly for the most up-to-date user state
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          active: true,
          branchId: true
      }
    });

    if (!user) {
         console.warn("getSessionUser: Session exists but user not found in DB:", session.user.id);
         return null;
    }

    if (!user.active) {
         console.warn("getSessionUser: User account is inactive:", user.email);
         return null;
    }

    // 3. Return a consistent session-like object
    return {
        user: {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            branchId: user.branchId
        }
    };

  } catch (error) {
    console.error("Error in getSessionUser:", error);
    return null;
  }
}
