import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, scores } from '@/lib/db/schema';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    await db.delete(scores);
    await db.delete(players);

    return NextResponse.json({ purged: true });
  } catch (error) {
    console.error('Purge error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
