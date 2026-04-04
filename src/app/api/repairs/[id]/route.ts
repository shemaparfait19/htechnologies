// API route for individual repair operations
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

import { auth } from '@/lib/auth';
import { canEditRepairDetails, hasPermission } from '@/lib/permissions'; 
// using hasPermission for delete_repairs if canDeleteRepairs helper missing.
// Checking permissions.ts again... I see 'delete_repairs' key but no helper?
// I exported canEditRepairDetails.
// I did NOT export canDeleteRepairs?
// I will use hasPermission(role, 'delete_repairs').

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const repair = await prisma.repairJob.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
        partsUsed: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!repair) {
      return NextResponse.json(
        { error: 'Repair job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(repair);
  } catch (error: any) {
    console.error('Error fetching repair:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repair' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !canEditRepairDetails((session.user as any).role)) {
       return NextResponse.json({ error: "Unauthorized: Need manage permissions" }, { status: 403 });
    }

    const body = await request.json();

    // If estimatedCost is being updated, sync actualCost and recalculate balance
    if (body.estimatedCost !== undefined) {
      const currentRepair = await prisma.repairJob.findUnique({
        where: { id: params.id },
        select: { depositPaid: true, estimatedCost: true }
      });

      if (currentRepair) {
        const newEstimatedCost = parseFloat(body.estimatedCost) || 0;
        const deposit = body.depositPaid !== undefined ? parseFloat(body.depositPaid) : (currentRepair.depositPaid || 0);
        
        // If estimatedCost is set, use it as actualCost
        // This ensures reports show the agreed price, not parts cost
        if (newEstimatedCost > 0) {
          body.actualCost = newEstimatedCost;
          body.balance = newEstimatedCost - deposit;
        }
      }
    }

    // If only depositPaid is updated (without estimatedCost), recalculate balance
    if (body.depositPaid !== undefined && body.estimatedCost === undefined) {
      const currentRepair = await prisma.repairJob.findUnique({
        where: { id: params.id },
        select: { actualCost: true, estimatedCost: true }
      });

      if (currentRepair) {
        const deposit = parseFloat(body.depositPaid) || 0;
        const cost = currentRepair.estimatedCost || currentRepair.actualCost || 0;
        body.balance = cost - deposit;
      }
    }

    const repair = await prisma.repairJob.update({
      where: { id: params.id },
      data: body,
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json(repair);
  } catch (error: any) {
    console.error('Error updating repair:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update repair' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    // Check permission for deleting repairs. Key is 'delete_repairs'.
    if (!session || !session.user || !hasPermission((session.user as any).role, 'delete_repairs')) {
       return NextResponse.json({ error: "Unauthorized: Only Admins can delete repairs" }, { status: 403 });
    }

    await prisma.repairJob.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting repair:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete repair' },
      { status: 500 }
    );
  }
}
