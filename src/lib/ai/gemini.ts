import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is missing from environment variables.');
}

export const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
