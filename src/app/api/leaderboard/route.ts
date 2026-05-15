import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scores, players } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const leaderboard = await db
      .select({
        username: players.username,
        bestScore: sql<number>`MAX(${scores.score})`.as('best_score'),
      })
      .from(scores)
      .innerJoin(players, eq(scores.playerId, players.id))
      .groupBy(players.id, players.username)
      .orderBy(desc(sql`MAX(${scores.score})`))
      .limit(5);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ leaderboard: [] });
  }
}
