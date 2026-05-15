import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { magicCodes } from '@/lib/db/schema';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const { count = 1 } = await request.json().catch(() => ({ count: 1 }));
    const numCodes = Math.min(Math.max(1, count), 50);

    const codes: string[] = [];
    for (let i = 0; i < numCodes; i++) {
      const code = generateCode();
      await db.insert(magicCodes).values({ code });
      codes.push(code);
    }

    return NextResponse.json({ codes, generated: codes.length });
  } catch (error) {
    console.error('Generate codes error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const allCodes = await db.select().from(magicCodes);
    const unused = allCodes.filter(c => !c.usedBy);
    const used = allCodes.filter(c => c.usedBy);

    return NextResponse.json({
      codes: allCodes,
      stats: { total: allCodes.length, unused: unused.length, used: used.length },
    });
  } catch (error) {
    console.error('List codes error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
