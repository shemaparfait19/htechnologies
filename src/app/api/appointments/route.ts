// API route for appointments
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: true,
        assignedUser: true,
      },
      orderBy: {
        appointmentDate: 'asc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.customerId || !body.title || !body.appointmentDate || !body.assignedTo || !body.createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId: body.customerId,
        title: body.title,
        description: body.description || '',
        appointmentDate: new Date(body.appointmentDate),
        duration: body.duration || 60,
        status: body.status || 'scheduled',
        assignedTo: body.assignedTo,
        location: body.location || null,
        createdBy: body.createdBy,
      },
      include: {
        customer: true,
        assignedUser: true,
      },
    });

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}
