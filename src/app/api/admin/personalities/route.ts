import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/libs/prisma-client';

// GET /api/admin/personalities - 获取所有personality types
export async function GET() {
  try {
    const personalities = await prisma.personalityType.findMany({
      orderBy: [
        { status: 'desc' }, // active first
        { created_at: 'desc' },
      ],
    });

    // 转换数据库字段到前端格式
    const formatted = personalities.map(p => ({
      id: p.id,
      type: p.personality_key,
      name: p.personality_name,
      description: p.personality_desc || '',
      emoji: p.emoji || '🎭',
      stars: p.stars,
      status: p.status as 'active' | 'draft',
      accentColor: p.accent_color,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching personalities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personalities' },
      { status: 500 }
    );
  }
}

// POST /api/admin/personalities - 创建新的personality type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description, emoji, stars, status, accentColor } = body;

    // 验证必填字段
    if (!type || !name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    const personality = await prisma.personalityType.create({
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

    return NextResponse.json(formatted, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating personality:', error);

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
      { error: 'Failed to create personality' },
      { status: 500 }
    );
  }
}
