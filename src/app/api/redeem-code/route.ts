import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicCodes, players } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { hashPin } from '@/lib/crypto';

export async function POST(request: NextRequest) {
  try {
    const { playerId, pin, code } = await request.json();

    if (!playerId || !pin || !code) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }

    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    }
    const pinHashed = await hashPin(pin, player.id);
    if (pinHashed !== player.pinHash) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 403 });
    }

    const [magicCode] = await db
      .select()
      .from(magicCodes)
      .where(and(eq(magicCodes.code, code.toUpperCase()), isNull(magicCodes.usedBy)));

    if (!magicCode) {
      return NextResponse.json({ error: 'Invalid or already used code.' }, { status: 400 });
    }

    await db
      .update(magicCodes)
      .set({ usedBy: playerId, usedAt: new Date() })
      .where(eq(magicCodes.id, magicCode.id));

    return NextResponse.json({ redeemed: true, message: '+1 bonus attempt unlocked!' });
  } catch (error) {
    console.error('Redeem code error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
