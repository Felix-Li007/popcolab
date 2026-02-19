import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma-client';

// GET /api/admin/personalities/[id] - 获取单个personality type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    const personality = await prisma.personalityType.findUnique({
      where: { id },
    });

    if (!personality) {
      return NextResponse.json(
        { error: 'Personality not found' },
        { status: 404 }
      );
    }

    // 转换数据库字段到前端格式
    const formatted = {
      id: personality.id,
      type: personality.personality_key,
      name: personality.personality_name,
      description: personality.personality_desc || '',
      emoji: personality.emoji || '🎭',
      stars: personality.stars,
      status: personality.status as 'active' | 'draft',
      accentColor: personality.accent_color,
      createdAt: personality.created_at,
      updatedAt: personality.updated_at,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching personality:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personality' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/personalities/[id] - 更新personality type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, name, description, emoji, stars, status, accentColor } = body;

    // 验证必填字段
    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    const personality = await prisma.personalityType.update({
      where: { id },
      data: {
        personality_key: type,
        personality_name: name,
        personality_desc: description || null,
        emoji: emoji || null,
        stars: stars || 3,
        status: status || 'active',
        accent_color: accentColor || null,
      },
    });

    // 转换返回格式
    const formatted = {
      id: personality.id,
      type: personality.personality_key,
      name: personality.personality_name,
      description: personality.personality_desc || '',
      emoji: personality.emoji || '🎭',
      stars: personality.stars,
      status: personality.status as 'active' | 'draft',
      accentColor: personality.accent_color,
      createdAt: personality.created_at,
      updatedAt: personality.updated_at,
    };

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error('Error updating personality:', error);

    // 处理不存在的记录
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Personality not found' },
        { status: 404 }
      );
    }

    // 处理唯一约束错误
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'A personality with this type already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update personality' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/personalities/[id] - 删除personality type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid personality ID' },
        { status: 400 }
      );
    }

    await prisma.personalityType.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Personality deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting personality:', error);

    // 处理不存在的记录
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Personality not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete personality' },
      { status: 500 }
    );
  }
}
