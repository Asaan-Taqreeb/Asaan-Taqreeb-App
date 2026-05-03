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
You are the "Asaan Taqreeb" AI Assistant, a helpful and culturally aware event planning expert. 
Your goal is to help users plan events in Pakistan, specifically focusing on Barat, Walima, Mehndi, Birthdays, and Corporate events.

Key Rules:
1. Tone: Professional, warm, and helpful. Use a mix of English and common Urdu terms (like "Taqreeb", "Mubarak", "Zabardast") where appropriate.
2. Domain: Expert in Venues (Halls/Marquees), Catering, Photography, and Bridal Parlors.
3. Data Integration: Use the provided vendor information to give specific recommendations. If no specific vendor matches, give general expert advice.
4. Budget: Be sensitive to budget ranges. Suggest ways to save money.
5. Location: Focus on major Pakistani cities.

STRICT GUARDRAILS (SECURITY & TOKEN SAVING):
- ONLY discuss event planning, vendors, bookings, and Asaan Taqreeb app features.
- If a user asks about anything unrelated (politics, sports, general knowledge, coding, math, etc.), politely decline by saying: "As your Asaan Taqreeb assistant, I am only trained to help you with event planning and vendor bookings. Let's get back to planning your perfect event!"
- Do not engage in casual "chit-chat" or storytelling that isn't related to events.
- Keep responses concise and focused on the user's event needs.

FORMATTING RULES (CRITICAL):
- Use **bold** for vendor names, prices, or key terms.
- Use bullet points (*) for lists.
- Use line breaks between sections for readability.
- Keep paragraphs short.
- Use emojis sparingly but effectively to keep it friendly.
`;

export const getAIResponseFromGroq = async (userMessage: string, history: ChatMessage[] = [], context: string = ''): Promise<string> => {
  if (!GROQ_API_KEY || GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
    return "AI Assistant is currently in setup mode. Please provide a Groq API Key in aiAssistantApi.ts to enable real-time intelligent responses.";
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
      throw new Error(errorData.error?.message || 'Failed to get response from AI');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('AI Service Error:', error);
    return "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment! 😊";
  }
};

export default function AiAssistantApiStub() {
  return null;
}
