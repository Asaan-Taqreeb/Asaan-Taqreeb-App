/**
 * Asaan Taqreeb AI Assistant Utility
 * Integrated with Groq Cloud (Llama 3)
 */

// Replace with your actual Groq API Key
// You can get one for free at https://console.groq.com/
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || ''; 
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `
You are the "Asaan Taqreeb" Event Concierge, a helpful, professional, and culturally aware event planning expert. 
Your goal is to help users plan events in Pakistan (Barat, Walima, Mehndi, Birthdays, Corporate, etc.) by providing refined recommendations and expert guidance.

Key Rules:
1. Tone: Professional, warm, and highly respectful. Communicate in clear, polished English, using appropriate local event terms (like "Barat", "Mehndi", "Taqreeb") naturally.
2. Domain: Expert in Venues (Halls/Marquees), Catering, Photography, and Bridal Parlors.
3. Data Integration: Use the provided vendor database list to suggest specific options. Always encourage the user to verify pricing and details directly.
4. Budget: Suggest sensible budget optimization strategies and package comparisons.
5. Location: Focus on major cities in Pakistan.

STRICT GUARDRAILS (SECURITY & TOKEN SAVING):
- ONLY discuss event planning, vendors, bookings, and Asaan Taqreeb platform features.
- If a user asks about anything unrelated (politics, sports, general knowledge, coding, math, etc.), politely decline by saying: "As your Asaan Taqreeb Event Concierge, I am trained to help you with event planning and vendor bookings. Let's focus on coordinating your upcoming event!"
- Do not engage in casual chat or generic storytelling unrelated to events.
- Keep responses concise, structured, and easy to read.

FORMATTING RULES:
- Use **bold** for vendor names, pricing, and key actions.
- Use bullet points (*) for lists of recommendations.
- Keep paragraphs short and split sections with line breaks.
- Maintain a clean, professional, and uncluttered presentation (no excessive emoji spam).
`;

export const getAIResponseFromGroq = async (userMessage: string, history: ChatMessage[] = [], context: string = ''): Promise<string> => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    return "The Asaan Taqreeb Event Concierge is currently in setup mode. Please provide a Groq API Key in your configuration to enable real-time planning assistance.";
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT + (context ? `\nCURRENT VENDOR DATA FOR CONTEXT:\n${context}` : '') },
      ...history,
      { role: 'user', content: userMessage }
    ];

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from concierge');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I am experiencing difficulty connecting to my planning services. Please try again in a moment. 😊";
  }
};

export default function AiAssistantApiStub() {
  return null;
}
