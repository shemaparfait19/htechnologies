import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const updated = await prisma.user.update({
      where: { email: 'htechnologiesltd1@gmail.com' },
      data: { passwordHash: hash, fullName: 'H Technologies LTD', active: true }
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Password forcefully reset to admin123 and name set to H Technologies LTD for ' + updated.email 
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
