import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || 
                          nextUrl.pathname.startsWith("/inventory") ||
                          nextUrl.pathname.startsWith("/sales") ||
                          nextUrl.pathname.startsWith("/repairs") || 
                          nextUrl.pathname.startsWith("/customers") ||
                          nextUrl.pathname === "/"
                          
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.branchId = (user as any).branchId;
      }
      
      // Update session if requested (e.g., profile update)
      if (trigger === "update" && session) {
        return { ...token, ...session.user };
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).branchId = token.branchId;
      }
      return session;
    },
  },
  providers: [], // Add providers with an empty array for now
  session: {
    strategy: 'jwt',
  },
  trustHost: true, // Required for NextAuth v5 in production (Vercel)
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
