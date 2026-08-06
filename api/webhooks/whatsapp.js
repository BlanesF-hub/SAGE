export default function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'sage_verify_token') {
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  if (req.method === 'POST') {
    console.log('WhatsApp Webhook payload:', JSON.stringify(req.body));
    return res.status(200).json({ status: 'ok' });
  }

  return res.status(405).send('Method Not Allowed');
}
