import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    const updated = await prisma.user.upsert({
      where: { email: 'htechnologiesltd1@gmail.com' },
      update: { passwordHash: hash, fullName: 'H Technologies LTD', active: true, role: 'owner' },
      create: {
          email: 'htechnologiesltd1@gmail.com',
          passwordHash: hash,
          fullName: 'H Technologies LTD',
          active: true,
          role: 'owner',
          username: 'admin',
          phone: '0000000000'
      }
    });
    return NextResponse.json({ 
      success: true, 
      message: 'Password forcefully reset to admin123 and name set to H Technologies LTD for ' + updated.email 
    });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  }
}
