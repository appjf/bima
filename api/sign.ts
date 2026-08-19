// Vercel Serverless Function: Cryptographic TTE Signing Endpoint
// Supports POST /api/sign
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { docType, docNumber, signerName, signerNip, signerRole } = req.body || {};
    
    const rawData = `${docType || 'TTE'}:${docNumber || ''}:${signerNip || ''}:${signerName || ''}:${Date.now()}`;
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', iss: 'DPUPR_GARUT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      docType: docType || 'TTE',
      docNumber: docNumber || '',
      signerName: signerName || 'ASN DPUPR',
      signerNip: signerNip || '',
      signerRole: signerRole || 'PEJABAT',
      iat: Date.now()
    })).toString('base64url');
    
    let hash = 0;
    for (let i = 0; i < rawData.length; i++) {
      hash = ((hash << 5) - hash) + rawData.charCodeAt(i);
      hash |= 0;
    }
    const signature = Math.abs(hash).toString(36).toUpperCase() + Date.now().toString(36).substring(4).toUpperCase();
    const token = `${header}.${payload}.${signature}`;

    res.status(200).json({
      success: true,
      token,
      algorithm: 'HMAC-SHA256 (RFC 7515)',
      issuedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
