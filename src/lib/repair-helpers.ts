import { prisma } from '@/lib/prisma';

/**
 * Recalculates the actual cost and balance of a repair job based on parts used.
 * Should be called whenever parts are added, updated, or removed.
 */
export async function updateRepairFinancials(repairId: string) {
  try {
    // 1. Get all parts used for this repair
    const parts = await prisma.repairPartUsed.findMany({
      where: { repairJobId: repairId },
    });

    // 2. Calculate total cost
    const totalPartsCost = parts.reduce((sum, part) => {
        // Use totalCost if available (it should be), otherwise calc from unitCost * qty
        const cost = part.totalCost || (part.unitCost * part.quantity);
        return sum + cost;
    }, 0);

    // 3. Get current repair to check deposit and estimated cost
    const repair = await prisma.repairJob.findUnique({
        where: { id: repairId },
        select: { depositPaid: true, estimatedCost: true }
    });

    if (!repair) return;

    const deposit = repair.depositPaid || 0;
    const estimatedCost = repair.estimatedCost || 0;
    
    // Logic: If estimated cost (agreed price) is set, use it as final revenue.
    // Otherwise, default to sum of parts.
    const finalRevenue = estimatedCost > 0 ? estimatedCost : totalPartsCost;
    
    const balance = finalRevenue - deposit;

    // 4. Update the repair job
    await prisma.repairJob.update({
      where: { id: repairId },
      data: {
        actualCost: finalRevenue,
        balance: balance,
      },
    });

    console.log(`Updated financials for repair ${repairId}: Cost=${totalPartsCost}, Balance=${balance}`);

  } catch (error) {
    console.error(`Failed to update repair financials for ${repairId}:`, error);
    // Don't throw, just log. We don't want to break the API response if this background task fails.
  }
}
