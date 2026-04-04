// API route for stock adjustments
import { NextRequest, NextResponse } from 'next/server';
import { updateStockQuantity } from '@/lib/data-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, quantity, type, reason, userId, notes } = body;

    await updateStockQuantity(
      itemId,
      quantity,
      type,
      reason,
      userId,
      undefined,
      notes
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust stock' },
      { status: 500 }
    );
  }
}
