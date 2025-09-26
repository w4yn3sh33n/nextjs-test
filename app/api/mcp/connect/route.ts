import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { serverId, url, transport } = await request.json();

    if (!serverId || !url) {
      return NextResponse.json(
        { error: 'Server ID and URL are required' },
        { status: 400 }
      );
    }

    // 먼저 간단한 연결 테스트를 시도
    console.log(`Testing connection to: ${url}`);
    
    try {
      // 1단계: 간단한 GET 요청으로 서버 접근 가능성 확인
      const simpleResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'User-Agent': 'MCP-Client/1.0'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (simpleResponse.ok) {
        console.log('Simple connection test successful');
        return NextResponse.json({
          success: true,
          message: 'Server is reachable',
          serverInfo: {
            name: 'HTTP Server',
            version: '1.0.0',
            description: 'Server is running and accessible',
            mcpSupported: false
          }
        });
      }
    } catch (simpleError) {
      console.log('Simple connection test failed:', simpleError);
    }

    // 2단계: MCP 프로토콜 테스트
    try {
      // MCP 서버는 일반적으로 POST 요청을 사용하며, 특별한 헤더가 필요합니다
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MCP-Client/1.0'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              prompts: {},
              resources: {}
            },
            clientInfo: {
              name: 'chat-ui-client',
              version: '1.0.0'
            }
          }
        }),
        signal: AbortSignal.timeout(10000) // 10초 타임아웃
      });

      if (!response.ok) {
        // 406 오류의 경우, MCP 프로토콜을 지원하지 않지만 서버는 접근 가능할 수 있음
        if (response.status === 406) {
          console.log('MCP protocol not supported, but server might be accessible');
          // 이미 1단계에서 GET 요청을 시도했으므로, 여기서는 실패로 처리
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // MCP 서버 응답 처리
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        return NextResponse.json({
          success: true,
          message: 'MCP server connected successfully',
          serverInfo: {
            name: data.result?.serverInfo?.name || 'MCP Server',
            version: data.result?.serverInfo?.version || '1.0.0',
            description: data.result?.serverInfo?.description || 'MCP server connected',
            mcpSupported: true
          }
        });
      } else {
        // JSON이 아닌 응답의 경우, 서버가 접근 가능하다고 간주
        return NextResponse.json({
          success: true,
          message: 'Server is reachable',
          serverInfo: {
            name: 'HTTP Server',
            version: '1.0.0',
            description: 'Server is running and accessible (non-MCP)',
            mcpSupported: false
          }
        });
      }

    } catch (error) {
      console.error('MCP server connection error:', error);
      
      // 406 오류의 경우, 서버가 실행 중이지만 MCP 프로토콜을 지원하지 않는다고 간주
      if (error instanceof Error && error.message.includes('HTTP 406')) {
        console.log('Server returns 406, treating as non-MCP but accessible server');
        return NextResponse.json({
          success: true,
          message: 'Server is reachable but does not support MCP protocol',
          serverInfo: {
            name: 'HTTP Server',
            version: '1.0.0',
            description: 'Server is running and accessible (non-MCP)',
            mcpSupported: false
          }
        });
      }
      
      // 다른 오류의 경우, 더 친화적인 오류 메시지 제공
      let errorMessage = 'Connection failed';
      let details = 'Failed to connect to MCP server. Please check the URL and ensure the server is running.';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Network error';
          details = 'Unable to reach the server. Please check the URL and network connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: details
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
