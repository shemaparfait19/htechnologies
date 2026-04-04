// API route for customers
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { getSessionUser } from '@/lib/auth-helper';
import { logUserAction } from '@/lib/log-helper';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const whereClause: any = {};
    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
       whereClause.branchId = session.user.branchId;
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(customers);
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, phone2, email, address, customerType, notes } = body;

    // Validate required fields
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        phone2: phone2 || null,
        email: email || null,
        address: address || null,
        customerType: customerType || 'walk_in',
        notes: notes || null,
        branchId: session?.user?.branchId || undefined,
      },
    });

    await logUserAction('Added Customer', `Name: ${name}`, session);

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create customer' },
      { status: 500 }
    );
  }
}
