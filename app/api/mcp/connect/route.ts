import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { serverId, url } = await request.json();

    if (!serverId || !url) {
      return NextResponse.json(
        { error: 'Server ID and URL are required' },
        { status: 400 }
      );
    }

    // MCP 서버 연결 테스트
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Client/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // MCP 서버가 정상적으로 응답하는지 확인
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format: Expected JSON');
      }

      const data = await response.json();
      
      // MCP 서버의 기본 정보 확인
      if (!data.name && !data.version) {
        throw new Error('Invalid MCP server: Missing required fields');
      }

      return NextResponse.json({
        success: true,
        message: 'MCP server connected successfully',
        serverInfo: {
          name: data.name || 'Unknown',
          version: data.version || '1.0.0',
          description: data.description || ''
        }
      });

    } catch (error) {
      console.error('MCP server connection error:', error);
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        details: 'Failed to connect to MCP server. Please check the URL and ensure the server is running.'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
