import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { players, scores } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { verifyAdmin, unauthorizedResponse } from '@/lib/admin-auth';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) return unauthorizedResponse();

  try {
    const data = await db
      .select({
        username: players.username,
        firstName: players.firstName,
        lastName: players.lastName,
        jobTitle: players.jobTitle,
        email: players.email,
        bestScore: sql<number>`COALESCE(MAX(${scores.score}), 0)`.as('best_score'),
        attempts: sql<number>`COUNT(${scores.id})`.as('attempts'),
        registeredAt: players.createdAt,
      })
      .from(players)
      .leftJoin(scores, eq(scores.playerId, players.id))
      .groupBy(players.id)
      .orderBy(sql`MAX(${scores.score}) DESC NULLS LAST`);

    const rows = data.map((row) => ({
      'Username': row.username,
      'First Name': row.firstName,
      'Last Name': row.lastName,
      'Job Title': row.jobTitle,
      'Email': row.email,
      'Best Score': row.bestScore,
      'Attempts': row.attempts,
      'Registered At': row.registeredAt?.toISOString() || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 15 },
      { wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 22 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const today = new Date().toISOString().split('T')[0];
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="snaktocat-participants-${today}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
