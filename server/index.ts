import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
);


function categorizeExpense(description: string) {
  const lower = description.toLowerCase();
  
  // Simple keyword-based categorization
  if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('dunkin')) {
    return {
      category: 'Food & Dining',
      subcategory: 'Coffee & Tea',
      confidence: 0.95,
      explanation: 'Detected coffee-related keyword'
    };
  }
  
  if (lower.includes('uber') || lower.includes('lyft') || lower.includes('taxi')) {
    return {
      category: 'Transportation',
      subcategory: 'Ride Share',
      confidence: 0.95,
      explanation: 'Detected ride-sharing service'
    };
  }
  
  if (lower.includes('amazon') || lower.includes('walmart') || lower.includes('target')) {
    return {
      category: 'Shopping',
      subcategory: 'General',
      confidence: 0.85,
      explanation: 'Detected retail store'
    };
  }
  
  if (lower.includes('restaurant') || lower.includes('food') || lower.includes('lunch') || lower.includes('dinner')) {
    return {
      category: 'Food & Dining',
      subcategory: 'Restaurants',
      confidence: 0.9,
      explanation: 'Detected food-related keyword'
    };
  }
  
  if (lower.includes('rent') || lower.includes('mortgage')) {
    return {
      category: 'Bills & Utilities',
      subcategory: 'Rent/Mortgage',
      confidence: 0.95,
      explanation: 'Detected housing payment'
    };
  }
  
  if (lower.includes('gym') || lower.includes('fitness')) {
    return {
      category: 'Healthcare',
      subcategory: 'Fitness',
      confidence: 0.9,
      explanation: 'Detected fitness-related keyword'
    };
  }
  
  // Default fallback
  return {
    category: 'Other',
    subcategory: 'Miscellaneous',
    confidence: 0.5,
    explanation: 'Could not determine specific category'
  };
}

app.post('/api/categorize', async (req, res) => {
  try {
    const { expenseId, what } = req.body;

    if (!expenseId || !what) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = categorizeExpense(what);

    // Update the expense in Supabase
    const { error } = await supabase
      .from('expenses')
      .update({
        category: result.category,
        subcategory: result.subcategory,
        confidence: result.confidence,
        explanation: result.explanation,
      })
      .eq('id', expenseId);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update expense' });
    }

    res.json(result);
  } catch (error) {
    console.error('Categorization error:', error);
    res.status(500).json({ error: 'Failed to categorize expense' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});