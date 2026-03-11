import type { PrismaClient } from '@/libs/prisma/client';

export type SeedSchemaState = {
  hasIntakeFormTable: boolean;
  hasFormQuestionTable: boolean;
  hasFormDimensionTable: boolean;
  hasUserStatusColumn: boolean;
};

async function tableExists(
  prisma: PrismaClient,
  tableName: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = ${tableName}
    ) AS "exists"
  `;

  return Boolean(rows[0]?.exists);
}

async function columnExists(
  prisma: PrismaClient,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = ${tableName}
        AND column_name = ${columnName}
    ) AS "exists"
  `;

  return Boolean(rows[0]?.exists);
}

export async function getSeedSchemaState(
  prisma: PrismaClient
): Promise<SeedSchemaState> {
  const [
    hasIntakeFormTable,
    hasFormQuestionTable,
    hasFormDimensionTable,
    hasUserStatusColumn,
  ] = await Promise.all([
    tableExists(prisma, 'intake_form'),
    tableExists(prisma, 'form_question'),
    tableExists(prisma, 'form_dimension'),
    columnExists(prisma, 'user', 'status'),
  ]);

  return {
    hasIntakeFormTable,
    hasFormQuestionTable,
    hasFormDimensionTable,
    hasUserStatusColumn,
  };
}
