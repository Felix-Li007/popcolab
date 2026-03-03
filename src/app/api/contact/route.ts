import { NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma-client';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.name || !data.email || !data.subject || !data.message) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    await prisma.contact.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        company: data.company || '',
        subject: data.subject,
        message: data.message,
      },
    });

    return NextResponse.json({
      message: 'Message saved successfully ✅',
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: 'Failed to save message ❌' },
      { status: 500 }
    );
  }
}
