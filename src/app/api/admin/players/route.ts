import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, scores } from '@/lib/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const search = request.nextUrl.searchParams.get('search') || '';
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    let query = db
      .select({
        id: players.id,
        username: players.username,
        firstName: players.firstName,
        lastName: players.lastName,
        jobTitle: players.jobTitle,
        email: players.email,
        createdAt: players.createdAt,
        bestScore: sql<number>`COALESCE(MAX(${scores.score}), 0)`.as('best_score'),
        attempts: sql<number>`COUNT(${scores.id})`.as('attempts'),
      })
      .from(players)
      .leftJoin(scores, eq(scores.playerId, players.id))
      .groupBy(players.id)
      .orderBy(desc(players.createdAt))
      .limit(limit)
      .offset(offset);

    if (search) {
      query = query.where(
        sql`(${players.username} ILIKE ${'%' + search + '%'} OR ${players.email} ILIKE ${'%' + search + '%'} OR ${players.firstName} ILIKE ${'%' + search + '%'} OR ${players.lastName} ILIKE ${'%' + search + '%'})`
      ) as typeof query;
    }

    const playerList = await query;

    const [total] = await db.select({ count: sql<number>`COUNT(*)` }).from(players);

    return NextResponse.json({
      players: playerList,
      total: total.count,
      page,
      totalPages: Math.ceil(Number(total.count) / limit),
    });
  } catch (error) {
    console.error('Players list error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
