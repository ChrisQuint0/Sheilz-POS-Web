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

    // Call the Gemini API with fallback mechanism for rate limits
    let response;
    const fallbackModels = ['gemini-2.5-flash', 'gemini-3.5-flash-8b', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
    // Ensure we start with the configured model and don't duplicate it in fallbacks
    const modelsToTry = [GEMINI_MODEL, ...fallbackModels.filter(m => m !== GEMINI_MODEL)];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        response = await geminiClient.models.generateContent({
          model: model,
          contents: [
            ...history,
            { role: 'user', parts: [{ text: lastMessage.content }] }
          ],
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.2,
          }
        });
        
        // If successful, exit the loop
        break;
      } catch (e: any) {
        lastError = e;
        
        const errorMessage = e.message?.toLowerCase() || '';
        const status = e.status || '';
        
        // Check for 429 Resource Exhausted / Quota Limit
        if (
          errorMessage.includes('quota') || 
          errorMessage.includes('429') || 
          status === 'RESOURCE_EXHAUSTED' || 
          status === 429
        ) {
          console.warn(`[Sheilz AI] Rate limit exceeded for model ${model}. Trying fallback...`);
          continue; // Try the next model
        } else {
          // If it's a different error (e.g. invalid key), throw it immediately
          throw e;
        }
      }
    }

    if (!response) {
      throw lastError || new Error("All fallback models failed.");
    }

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
