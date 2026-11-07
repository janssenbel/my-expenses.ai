import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Server-side Gemini Vision endpoint for receipt scanning
  app.post('/api/receipts/scan', async (req, res) => {
    try {
      const { imageBase64, mimeType, receiptTextHint } = req.body;

      if (!imageBase64 && !receiptTextHint) {
        res.status(400).json({ error: 'Receipt image or text is required.' });
        return;
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: receiptTextHint
          ? `Extract the structured expense details from this receipt: ${receiptTextHint}. Map the category strictly to one of: "Groceries", "Food & Dining", "Transport", "Housing & Bills", "Shopping", "Health & Wellness", "Entertainment", "Other". Return today's date in YYYY-MM-DD if no date is visible.`
          : 'Analyze this receipt image and extract the merchant name, total amount paid (as a number), transaction date (in YYYY-MM-DD format), best matching expense category (strictly one of: "Groceries", "Food & Dining", "Transport", "Housing & Bills", "Shopping", "Health & Wellness", "Entertainment", "Other"), payment method ("GCash", "Maya", "Apple Pay", "Card", "Cash", or "Transfer"), and individual line items.',
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              merchant: {
                type: Type.STRING,
                description: 'Store or merchant name on the receipt.',
              },
              amount: {
                type: Type.NUMBER,
                description: 'Final total amount paid including tax/tip.',
              },
              date: {
                type: Type.STRING,
                description: 'Date of purchase in YYYY-MM-DD format.',
              },
              category: {
                type: Type.STRING,
                description:
                  'One of: Groceries, Food & Dining, Transport, Housing & Bills, Shopping, Health & Wellness, Entertainment, Other',
              },
              paymentMethod: {
                type: Type.STRING,
                description: 'One of: GCash, Maya, Apple Pay, Card, Cash, Transfer',
              },
              notes: {
                type: Type.STRING,
                description: 'Short summary of items purchased or tax/tip note.',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    price: { type: Type.NUMBER },
                  },
                  required: ['name', 'price'],
                },
              },
            },
            required: ['merchant', 'amount', 'category', 'paymentMethod'],
          },
        },
      });

      const jsonText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(jsonText);
      res.json({ receipt: parsed });
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Failed to analyze receipt with Gemini Vision.';
      console.error('Receipt scan error:', errMessage);
      res.status(500).json({
        error: errMessage,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verdant Ledger server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
