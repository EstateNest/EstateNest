import { expect, test } from '@playwright/test';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import submitQuote from '../api/submit-quote.js';

interface HandlerResult {
  status: number;
  payload: unknown;
}

async function invokeQuoteHandler(body: Record<string, unknown>, headers: Record<string, string> = {}): Promise<HandlerResult> {
  let statusCode = 200;
  let payload: unknown;
  const response = {
    setHeader: () => response,
    status: (nextStatus: number) => {
      statusCode = nextStatus;
      return response;
    },
    json: (nextPayload: unknown) => {
      payload = nextPayload;
      return response;
    },
  } as unknown as VercelResponse;
  const request = {
    method: 'POST',
    body,
    headers,
    socket: { remoteAddress: '127.0.0.1' },
  } as unknown as VercelRequest;

  await submitQuote(request, response);
  return { status: statusCode, payload };
}

test.describe('Quote API request protection', () => {
  test('rejects a cross-origin browser submission before database access', async () => {
    const result = await invokeQuoteHandler({}, {
      host: 'www.estatenest.ca',
      origin: 'https://malicious.example',
    });

    expect(result.status).toBe(403);
    expect(result.payload).toMatchObject({ success: false, message: 'Invalid request origin.' });
  });

  test('rejects a filled honeypot before database access', async () => {
    const result = await invokeQuoteHandler({ website: 'https://spam.example' });

    expect(result.status).toBe(400);
    expect(result.payload).toMatchObject({ success: false, message: 'Unable to accept this request.' });
  });
});
