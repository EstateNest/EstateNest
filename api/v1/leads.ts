import type { VercelRequest, VercelResponse } from '@vercel/node';
import crmHandler from '../crm.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  req.query = { ...req.query, resource: 'leads' };
  return crmHandler(req, res);
}
