import { verifyToken } from "./jwt";
import { prisma } from "./prisma";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Retrieves the fully authenticated user from the database based on the active session.
 * This verifies the session against the actual database table to ensure permissions 
 * are real-time and the user account is still active.
 */
export async function getSessionUser(request?: NextRequest) {
  try {
    // 1. Get the session using custom JWT cookie
    let token: string | undefined;
    
    if (request) {
      token = request.cookies.get('session_token')?.value;
    } else {
      token = (await cookies()).get('session_token')?.value;
    }

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.id) {
      return null;
    }

    // 2. Query the database directly for the most up-to-date user state
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
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
         console.warn("getSessionUser: Session exists but user not found in DB:", payload.id);
         return null;
    }

    if (!user.active) {
         console.warn("getSessionUser: User account is inactive:", user.email);
         return null;
    }

    // 3. Return a consistent session-like object for compatibility with API routes
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
