// API route for appointment updates
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        appointmentDate: new Date(body.appointmentDate),
        duration: body.duration,
        status: body.status,
        assignedTo: body.assignedTo,
        location: body.location,
      },
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete appointment' },
      { status: 500 }
    );
  }
}
