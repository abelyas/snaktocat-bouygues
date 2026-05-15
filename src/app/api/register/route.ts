import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPin } from '@/lib/crypto';
import { isValidEmailFormat, isPersonalEmail } from '@/lib/email-validation';

export async function POST(request: NextRequest) {
  try {
    const gameActive = await db.select().from(settings).where(eq(settings.key, 'game_active'));
    if (gameActive.length > 0 && gameActive[0].value === 'false') {
      return NextResponse.json(
        { error: 'The contest has ended.', gameInactive: true },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, jobTitle, email, username, pin } = body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!firstName || !lastName || !jobTitle || !normalizedEmail || !username || !pin) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json({ error: 'Username must be 3-30 characters.' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json({ error: 'Username can only contain letters, numbers, hyphens, and underscores.' }, { status: 400 });
    }

    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: 'Game PIN must be 4-6 digits.' }, { status: 400 });
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (isPersonalEmail(normalizedEmail)) {
      return NextResponse.json({
        error: 'Please use your professional email address. Personal emails (Gmail, Hotmail, Yahoo, etc.) are not accepted for this contest.',
      }, { status: 400 });
    }

    const existingEmail = await db.select().from(players).where(eq(players.email, normalizedEmail));
    if (existingEmail.length > 0) {
      return NextResponse.json({
        error: 'This email address is already registered. Each participant can only register once.',
      }, { status: 409 });
    }

    const existingUsername = await db.select().from(players).where(eq(players.username, username));
    if (existingUsername.length > 0) {
      return NextResponse.json({ error: 'This username is already taken. Please choose another.' }, { status: 409 });
    }

    const tempId = crypto.randomUUID();
    const pinHashed = await hashPin(pin, tempId);

    const [player] = await db.insert(players).values({
      id: tempId,
      username,
      firstName,
      lastName,
      jobTitle,
      email: normalizedEmail,
      pinHash: pinHashed,
      avatar: 'mona',
    }).returning();

    return NextResponse.json({
      player: {
        id: player.id,
        username: player.username,
        firstName: player.firstName,
        lastName: player.lastName,
        avatar: player.avatar,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
