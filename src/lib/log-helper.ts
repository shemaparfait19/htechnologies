import { prisma } from './prisma';

export async function logUserAction(action: string, details: string, session: any) {
  if (!session || !session.user) return;
  
  try {
    await prisma.userLog.create({
      data: {
        userId: session.user.id,
        branchId: session.user.branchId || null,
        action,
        details,
      }
    });
  } catch (error) {
    console.error('Failed to create UserLog:', error);
  }
}
