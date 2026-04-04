// API route for updating repair job status
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { RepairStatus } from '@prisma/client';

import { auth } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { status, notes } = await request.json();

    const updateData: any = {
      status: status as RepairStatus,
    };

    // Set timestamps based on status
    if (status === 'in_progress' && !updateData.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'ready' && !updateData.completedAt) {
      updateData.completedAt = new Date();
    } else if (status === 'collected' && !updateData.collectedAt) {
      updateData.collectedAt = new Date();
    }

    if (notes) {
      updateData.diagnosis = notes;
    }

    const repair = await prisma.repairJob.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    // Create notification for customer when device is ready
    if (status === 'ready') {
      // Find owner to send notification
      const owner = await prisma.user.findFirst({
        where: { role: 'owner', active: true },
      });

      if (owner) {
        await prisma.notification.create({
          data: {
            userId: owner.id,
            type: 'device_ready',
            message: `Device ready for pickup: ${repair.jobNumber} - ${repair.customer.name}`,
            relatedId: repair.id,
          },
        });
      }
    }

    return NextResponse.json(repair);
  } catch (error: any) {
    console.error('Error updating repair status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
