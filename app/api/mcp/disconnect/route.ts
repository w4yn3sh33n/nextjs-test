import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { serverId } = await request.json();

    if (!serverId) {
      return NextResponse.json(
        { error: 'Server ID is required' },
        { status: 400 }
      );
    }

    // MCP 서버 연결 해제
    // 실제 구현에서는 연결된 서버의 리소스를 정리하고
    // 연결 상태를 업데이트해야 합니다.
    
    return NextResponse.json({
      success: true,
      message: 'MCP server disconnected successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
