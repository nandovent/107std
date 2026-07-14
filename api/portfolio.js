const OWNER = process.env.GITHUB_OWNER || 'nandovent';
const REPO = process.env.GITHUB_REPO || '107std';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = 'data/portfolio.json';

const ghHeaders = () => ({
  'Accept': 'application/vnd.github+json',
  'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': '107std-admin'
});

async function getFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${encodeURIComponent(BRANCH)}`;
  const response = await fetch(url, { headers: ghHeaders() });
  if (!response.ok) throw new Error(`GitHub GET ${response.status}`);
  const data = await response.json();
  const content = Buffer.from(data.content.replace(/\n/g,''), 'base64').toString('utf8');
  return { items: JSON.parse(content), sha: data.sha };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store');
  const password = req.headers['x-admin-password'];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha inválida.' });
  }
  if (!process.env.GITHUB_TOKEN) return res.status(500).json({ error: 'GITHUB_TOKEN não configurado.' });

  try {
    if (req.method === 'GET') {
      const file = await getFile();
      return res.status(200).json(file.items);
    }
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.items)) return res.status(400).json({ error: 'Lista inválida.' });
      const current = await getFile();
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;
      const payload = {
        message: body.message || 'Atualiza portfólio pelo painel 107',
        content: Buffer.from(JSON.stringify(body.items, null, 2), 'utf8').toString('base64'),
        sha: current.sha,
        branch: BRANCH
      };
      const response = await fetch(url, { method:'PUT', headers:{...ghHeaders(),'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error:data.message || 'Erro ao salvar no GitHub.' });
      return res.status(200).json({ ok:true, commit:data.commit?.sha });
    }
    return res.status(405).json({ error:'Método não permitido.' });
  } catch (error) {
    return res.status(500).json({ error:error.message || 'Erro interno.' });
  }
}