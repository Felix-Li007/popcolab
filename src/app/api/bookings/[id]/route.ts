import { prisma } from '@/libs/prisma-client';
import { NextResponse } from 'next/server';

export async function DELETE(req: Request) {
  try {
    // ✅ Extract ID from URL instead of params
    const url = new URL(req.url);
    const idParam = url.pathname.split('/').pop();

    console.log('URL:', url.pathname);
    console.log('PARAM ID RAW:', idParam);

    const id = parseInt(idParam || '', 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // ✅  TYPE
    let body: { reason?: string } = {};

    try {
      body = await req.json();
    } catch {
      body = {};
    }

    console.log('Deleting booking ID:', id);
    console.log('Reason:', body?.reason);

    const existing = await prisma.userEvent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const updated = await prisma.userEvent.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancel_reason: body?.reason || 'No reason',
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    console.error('DELETE ERROR FULL:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Server error',
      },
      { status: 500 }
    );
  }
}
