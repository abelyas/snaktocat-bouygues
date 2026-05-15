import { pgTable, uuid, varchar, integer, timestamp, text, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 30 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  jobTitle: varchar('job_title', { length: 200 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  pinHash: varchar('pin_hash', { length: 128 }).notNull(),
  avatar: varchar('avatar', { length: 20 }).notNull().default('mona'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const scores = pgTable('scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  attemptNumber: integer('attempt_number').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  check('attempt_check', sql`${table.attemptNumber} >= 1`),
]);

export const magicCodes = pgTable('magic_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 20 }).unique().notNull(),
  usedBy: uuid('used_by').references(() => players.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  key: varchar('key', { length: 50 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
