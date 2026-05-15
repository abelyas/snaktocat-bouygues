import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scores, players, magicCodes } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { hashPin, decodePayload } from '@/lib/crypto';

const BASE_ATTEMPTS = 3;
const MAX_PLAUSIBLE_SCORE = 9999;
const MIN_SECONDS_PER_POINT = 0.3;

async function getMaxAttempts(playerId: string): Promise<number> {
  const [bonusCodes] = await db
    .select({ count: count() })
    .from(magicCodes)
    .where(eq(magicCodes.usedBy, playerId));
  return BASE_ATTEMPTS + Number(bonusCodes.count);
}

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('playerId');
  if (!playerId) {
    return NextResponse.json({ error: 'Missing playerId' }, { status: 400 });
  }

  try {
    const [attemptCount] = await db
      .select({ count: count() })
      .from(scores)
      .where(eq(scores.playerId, playerId));

    const playerScores = await db.select().from(scores).where(eq(scores.playerId, playerId));
    const bestScore = playerScores.length > 0 ? Math.max(...playerScores.map(s => s.score)) : 0;
    const maxAttempts = await getMaxAttempts(playerId);

    return NextResponse.json({
      attemptsUsed: Number(attemptCount.count),
      attemptsRemaining: maxAttempts - Number(attemptCount.count),
      maxAttempts,
      bestScore,
    });
  } catch {
    return NextResponse.json({ attemptsUsed: 0, attemptsRemaining: BASE_ATTEMPTS, maxAttempts: BASE_ATTEMPTS, bestScore: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let playerId: string;
    let score: number;
    let pin: string;
    let sessionStart: number;

    if (body.payload && body.ts) {
      const decoded = decodePayload(body.payload, body.ts);
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
      }
      const age = Date.now() - body.ts;
      if (age < -5000 || age > 600000) {
        return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
      }
      playerId = decoded.playerId;
      score = decoded.score;
      pin = decoded.pin;
      sessionStart = decoded.sessionStart;
    } else {
      return NextResponse.json({ error: 'Invalid request format.' }, { status: 400 });
    }

    if (!playerId || score === undefined || !pin) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const [player] = await db.select().from(players).where(eq(players.id, playerId));
    if (!player) {
      return NextResponse.json({ error: 'Player not found.' }, { status: 404 });
    }

    const pinHashed = await hashPin(pin, player.id);
    if (pinHashed !== player.pinHash) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 403 });
    }

    const [attemptCount] = await db
      .select({ count: count() })
      .from(scores)
      .where(eq(scores.playerId, playerId));

    const maxAttempts = await getMaxAttempts(playerId);
    if (Number(attemptCount.count) >= maxAttempts) {
      return NextResponse.json({ error: 'Maximum attempts reached.' }, { status: 403 });
    }

    const parsedScore = Math.floor(Number(score));
    if (isNaN(parsedScore) || parsedScore < 0 || parsedScore > MAX_PLAUSIBLE_SCORE) {
      return NextResponse.json({ error: 'Invalid score.' }, { status: 400 });
    }

    if (sessionStart && parsedScore > 0) {
      const elapsedSeconds = (Date.now() - Number(sessionStart)) / 1000;
      const minRequired = parsedScore * MIN_SECONDS_PER_POINT;
      if (elapsedSeconds < minRequired) {
        return NextResponse.json({ error: 'Invalid score.' }, { status: 400 });
      }
    }

    const attemptNumber = Number(attemptCount.count) + 1;

    await db.insert(scores).values({
      playerId,
      score: parsedScore,
      attemptNumber,
    });

    const playerScores = await db
      .select()
      .from(scores)
      .where(eq(scores.playerId, playerId));

    const bestScore = Math.max(...playerScores.map((s) => s.score));
    const attemptsRemaining = maxAttempts - attemptNumber;

    return NextResponse.json({
      saved: true,
      attemptNumber,
      attemptsRemaining,
      maxAttempts,
      bestScore,
      score: parsedScore,
    });
  } catch (error) {
    console.error('Score submission error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
