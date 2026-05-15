import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const { active } = await request.json();
    const value = active ? 'true' : 'false';

    const existing = await db.select().from(settings).where(eq(settings.key, 'game_active'));
    if (existing.length > 0) {
      await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, 'game_active'));
    } else {
      await db.insert(settings).values({ key: 'game_active', value });
    }

    return NextResponse.json({ active: value === 'true' });
  } catch (error) {
    console.error('Toggle error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const result = await db.select().from(settings).where(eq(settings.key, 'game_active'));
    const active = result.length === 0 || result[0].value === 'true';
    return NextResponse.json({ active });
  } catch {
    return NextResponse.json({ active: true });
  }
}
