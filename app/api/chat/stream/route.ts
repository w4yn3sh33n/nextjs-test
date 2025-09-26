import { NextRequest } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { message, chatHistory } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('GEMINI_API_KEY not configured', { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Build conversation history
          const contents = [];
          
          // Add chat history if provided
          if (chatHistory && chatHistory.length > 0) {
            for (const msg of chatHistory) {
              contents.push({
                role: msg.isUser ? 'user' : 'model',
                parts: [{ text: msg.content }]
              });
            }
          }
          
          // Add current message
          contents.push({
            role: 'user',
            parts: [{ text: message }]
          });

          const responseStream = await ai.models.generateContentStream({
            model: 'gemini-2.0-flash-exp',
            contents: contents,
            config: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              const data = JSON.stringify({ content: chunk.text });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          }

          // Send completion signal
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in Gemini streaming:', error);
          const errorData = JSON.stringify({ 
            content: 'Sorry, there was an error processing your request. Please try again.' 
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat stream:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
