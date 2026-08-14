import { NextResponse } from 'next/server';
import { geminiClient, GEMINI_MODEL } from '@/lib/ai/gemini';
import { getKnowledgeBaseContext } from '@/lib/ai/knowledge-base';
import { getSystemPrompt } from '@/lib/ai/prompt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required.' }, { status: 400 });
    }

    // Load the knowledge base context
    const kbContext = await getKnowledgeBaseContext();
    const systemInstruction = getSystemPrompt(kbContext);

    // Filter and map messages for the Gemini API
    // Ensure we only pass 'user' and 'model' roles as supported by the SDK
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
        return NextResponse.json({ error: 'Last message must be from user.' }, { status: 400 });
    }

    // Call the Gemini API
    const response = await geminiClient.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: lastMessage.content }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Low temperature for factual responses
      }
    });

    return NextResponse.json({
      role: 'assistant',
      content: response.text,
    });
  } catch (error: any) {
    console.error('Error in AI chat endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.', details: error.message },
      { status: 500 }
    );
  }
}
