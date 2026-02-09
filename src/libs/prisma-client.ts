import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@/libs/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
// const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter });

export { prisma };
