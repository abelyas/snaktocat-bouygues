import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const { id } = await params;

    const deleted = await db.delete(players).where(eq(players.id, id)).returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    }

    return NextResponse.json({ deleted: true, username: deleted[0].username });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
