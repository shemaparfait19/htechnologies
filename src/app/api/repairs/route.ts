// API route for repairs - GET all repairs and POST new repair
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/push-service';

import { auth } from '@/lib/auth';
import { getSessionUser } from '@/lib/auth-helper';
import { logUserAction } from '@/lib/log-helper';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    const session = await getSessionUser(request);
    const where: any = {
      ...(status && { status: status as any }),
      ...(assignedTo && { assignedTo }),
    };

    if (session?.user?.role !== 'owner' && session?.user?.branchId) {
      where.branchId = session.user.branchId;
    }

    const repairs = await prisma.repairJob.findMany({
      where,
      include: {
        customer: true,
        assignedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        partsUsed: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(repairs);
  } catch (error: any) {
    console.error('Error fetching repairs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch repairs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    const session = await getSessionUser(request);
    if (!session || !session.user) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    body = await request.json();
    console.log('Creating repair with data:', JSON.stringify(body, null, 2));
    
    const {
      customerId,
      deviceType,
      brand,
      model,
      serialNumber,
      imei,
      problemDescription,
      promisedDate,
      priority,
      estimatedCost, // Destructure this
      depositPaid,
      assignedTo,
      createdBy,
      photoUrls,
    } = body;

    // Validate required fields
    if (!customerId || !deviceType || !brand || !model || !problemDescription || !promisedDate || !createdBy) {
      console.error('Missing required fields:', {
        customerId: !!customerId,
        deviceType: !!deviceType,
        brand: !!brand,
        model: !!model,
        problemDescription: !!problemDescription,
        promisedDate: !!promisedDate,
        createdBy: !!createdBy,
      });
      return NextResponse.json(
        { error: 'Missing required fields: customerId, deviceType, brand, model, problemDescription, promisedDate, and createdBy are required' },
        { status: 400 }
      );
    }

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      console.error('Customer not found:', customerId);
      return NextResponse.json(
        { error: `Customer with ID ${customerId} not found` },
        { status: 400 }
      );
    }

    // Verify createdBy user exists
    const creator = await prisma.user.findUnique({
      where: { id: createdBy },
    });

    if (!creator) {
      console.error('Creator user not found:', createdBy);
      return NextResponse.json(
        { error: `User with ID ${createdBy} not found` },
        { status: 400 }
      );
    }

    // Verify assignedTo user exists if provided
    if (assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo },
      });

      if (!assignedUser) {
        console.error('Assigned user not found:', assignedTo);
        return NextResponse.json(
          { error: `Assigned user with ID ${assignedTo} not found` },
          { status: 400 }
        );
      }
    }

    // Generate job number
    const year = new Date().getFullYear();
    const lastJob = await prisma.repairJob.findFirst({
      orderBy: { createdAt: 'desc' },
      where: {
        jobNumber: {
          startsWith: `REP-${year}-`,
        },
      },
    });

    let jobNumber = `REP-${year}-0001`;
    if (lastJob) {
      const lastNumber = parseInt(lastJob.jobNumber.split('-')[2]);
      jobNumber = `REP-${year}-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    console.log('Generated job number:', jobNumber);

    const cost = estimatedCost ? parseFloat(estimatedCost) : 0;
    const deposit = depositPaid ? parseFloat(depositPaid) : 0;

    const repair = await prisma.repairJob.create({
      data: {
        jobNumber,
        customerId,
        deviceType,
        brand,
        model,
        serialNumber: serialNumber || null,
        imei: imei || null,
        problemDescription,
        promisedDate: new Date(promisedDate),
        priority: priority as any || 'normal',
        branchId: session?.user?.branchId || undefined,
        estimatedCost: cost,
        actualCost: cost, // Default actual cost to estimated cost for now
        depositPaid: deposit,
        balance: cost - deposit,
        assignedTo: assignedTo || null,
        createdBy,
        photoUrls: photoUrls || [],
        status: 'pending',
      },
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

    console.log('Repair created successfully:', repair.id);

    // Create notification for assigned technician
    if (assignedTo) {
      try {
        await prisma.notification.create({
          data: {
            userId: assignedTo,
            type: 'new_repair',
            message: `New repair job assigned: ${jobNumber}`,
            relatedId: repair.id,
          },
        });
        
        // Send Push Notification
        await sendPushNotification(
          assignedTo,
          'New Repair Assigned',
          `Job ${jobNumber} has been assigned to you.`,
          `/repairs/${repair.id}`
        );
        
        console.log('Notification created for technician');
      } catch (notifError) {
        console.error('Failed to create notification (non-critical):', notifError);
        // Don't fail the whole request if notification fails
      }
    }

    await logUserAction('Created Repair', `Job ${jobNumber} - ${brand} ${deviceType}`, session);

    return NextResponse.json(repair);
  } catch (error: any) {
    console.error('Error creating repair - Full error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Request body was:', body);
    
    return NextResponse.json(
      { error: error.message || 'Failed to create repair' },
      { status: 500 }
    );
  }
}
