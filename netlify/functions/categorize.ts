import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const SYSTEM_PROMPT = `You are a financial categorization expert. Given a short expense description, categorize it deterministically.

Categories and subcategories:
- Food & Dining: Restaurants, Groceries, Coffee & Tea, Delivery, Bars
- Transportation: Ride Share, Public Transit, Gas, Parking, Vehicle Maintenance
- Shopping: Clothing, Electronics, Home Goods, Personal Care, Gifts
- Bills & Utilities: Rent/Mortgage, Electric, Water, Internet, Phone, Insurance
- Entertainment: Movies, Games, Music, Sports, Events
- Travel: Hotels, Flights, Activities, Travel Food
- Healthcare: Doctor, Pharmacy, Dental, Vision, Fitness
- Education: Courses, Books, Supplies, Tuition
- Business: Software, Equipment, Services, Marketing
- Other: Miscellaneous

Output JSON only:
{
  "category": "Main Category",
  "subcategory": "Specific Subcategory",
  "confidence": 0.95,
  "explanation": "Brief explanation"
}`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { expenseId, what } = JSON.parse(event.body || '{}');

    if (!expenseId || !what) {
      return { statusCode: 400, body: 'Missing required fields' };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: what },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    const { error } = await supabase
      .from('expenses')
      .update({
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
        explanation: result.explanation,
      })
      .eq('id', expenseId);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Categorization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to categorize expense' }),
    };
  }
};