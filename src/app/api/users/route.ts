// API route for users
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getSessionUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const where: any = { active: true };
    if (role) where.role = role;
    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
       where.branchId = session.user.branchId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        active: true,
        branchId: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phone, role, password, branchId } = body;

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create username from email
    const username = email.split('@')[0];

    // Create user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        username,
        phone: phone || null,
        role: role === 'admin' ? 'owner' : role, // Map admin to owner if needed, though frontend should send correct value
        passwordHash: hashedPassword,
        active: true,
        branchId: branchId || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
