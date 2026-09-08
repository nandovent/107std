const OWNER = process.env.GITHUB_OWNER || 'nandovent';
const REPO = process.env.GITHUB_REPO || '107std';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const DATA_PATH = 'data/checklists.json';

const ghHeaders = () => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': '107std-checklists'
});

function authorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const received = req.headers['x-admin-password'];
  return Boolean(expected && received && received === expected);
}

async function getGithubFile() {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_PATH}?ref=${encodeURIComponent(BRANCH)}`;
  const response = await fetch(url, { headers: ghHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub GET ${response.status}`);
  const data = await response.json();
  const text = Buffer.from(String(data.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
  return { sha: data.sha, content: JSON.parse(text) };
}

async function putGithubFile(content, sha) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`;
  const payload = {
    message: 'Atualiza checklists de produção',
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    branch: BRANCH
  };
  if (sha) payload.sha = sha;
  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `GitHub PUT ${response.status}`);
  return data;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authorized(req)) return res.status(401).json({ error: 'Não autorizado.' });
  try {
    if (req.method === 'GET') {
      const file = await getGithubFile();
      return res.status(200).json(file ? file.content : { version: 1, templates: [], lists: [] });
    }
    if (req.method === 'PUT') {
      const incoming = req.body;
      if (!incoming || !Array.isArray(incoming.templates) || !Array.isArray(incoming.lists)) {
        return res.status(400).json({ error: 'Dados inválidos.' });
      }
      const current = await getGithubFile();
      await putGithubFile(incoming, current && current.sha);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Não foi possível salvar a checklist.' });
  }
};
