import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/libs/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;

//const adapter = new PrismaBetterSqlite3({ url: connectionString });
const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

const prisma = global.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export { prisma };
