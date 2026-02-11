import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma-client';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const user = await prisma.user.create({
    data: { email: body.email, name: body.name },
  });
  return NextResponse.json(user);
}

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}
