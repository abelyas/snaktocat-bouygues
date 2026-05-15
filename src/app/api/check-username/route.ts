import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');

  if (!username || username.length < 3) {
    return NextResponse.json({ available: false });
  }

  const existing = await db.select().from(players).where(eq(players.username, username));
  return NextResponse.json({ available: existing.length === 0 });
}
