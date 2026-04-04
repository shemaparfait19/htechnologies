// API route for expenses
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
      where.branchId = session.user.branchId;
    }
    
    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Owners, managers, and sales staff can record expenses
    if (!['owner', 'manager', 'sales'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden: Only owners, managers, and sales staff can record expenses' }, { status: 403 });
    }

    const body = await request.json();

    if (!body.category || !body.description || !body.amount) {
      return NextResponse.json(
        { error: 'category, description, and amount are required' },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        category: body.category,
        description: body.description,
        amount: parseFloat(body.amount),
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
        userId: session.user.id, // Use the logged-in user's ID
        notes: body.notes || null,
        branchId: session.user.branchId || undefined,
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create expense' },
      { status: 500 }
    );
  }
}

