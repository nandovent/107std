const OWNER=process.env.GITHUB_OWNER||'nandovent';
const REPO=process.env.GITHUB_REPO||'107std';
const BRANCH=process.env.GITHUB_BRANCH||'main';
const DATA_PATH='data/clientes.json';
const ghHeaders=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${process.env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'107std-admin'});

async function getGithubFile(path){
  const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`;
  const response=await fetch(url,{headers:ghHeaders()});
  if(response.status===404)return null;
  if(!response.ok)throw new Error(`GitHub GET ${response.status}`);
  const data=await response.json();
  const buffer=Buffer.from(String(data.content||'').replace(/\n/g,''),'base64');
  return {sha:data.sha,buffer,content:buffer.toString('utf8')};
}
async function putContent(path,content,message,sha){
  const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const payload={message,content:Buffer.from(content).toString('base64'),branch:BRANCH};
  if(sha)payload.sha=sha;
  const response=await fetch(url,{method:'PUT',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message||'Erro ao salvar no GitHub.');
  return data;
}
const mimeFromPath=path=>({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml'})[String(path).split('.').pop().toLowerCase()]||'application/octet-stream';
export const config={api:{bodyParser:{sizeLimit:'8mb'}}};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  try{
    const asset=typeof req.query?.asset==='string'?req.query.asset:'';
    if(req.method==='GET'&&asset){
      const safe=asset.replace(/^\/+/, '');
      if(!/^assets\/clientes\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp|svg)$/i.test(safe))return res.status(400).json({error:'Arquivo inválido.'});
      if(!process.env.GITHUB_TOKEN)return res.status(500).json({error:'GITHUB_TOKEN não configurado.'});
      const file=await getGithubFile(safe);
      if(!file)return res.status(404).end();
      res.setHeader('Content-Type',mimeFromPath(safe));
      return res.status(200).send(file.buffer);
    }
    if(!process.env.ADMIN_PASSWORD||req.headers['x-admin-password']!==process.env.ADMIN_PASSWORD)return res.status(401).json({error:'Senha inválida.'});
    if(!process.env.GITHUB_TOKEN)return res.status(500).json({error:'GITHUB_TOKEN não configurado.'});
    const current=await getGithubFile(DATA_PATH);
    const items=current?JSON.parse(current.content):[];
    if(req.method==='GET')return res.status(200).json(items);
    if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body||!Array.isArray(body.items))return res.status(400).json({error:'Lista inválida.'});
    const next=[];
    for(const raw of body.items){
      const item={...raw};
      delete item._preview;
      if(item.upload&&item.upload.dataUrl){
        const match=item.upload.dataUrl.match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/);
        if(!match)throw new Error('Formato de imagem inválido. Use PNG, JPG, WEBP ou SVG.');
        const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'}[match[1]];
        const safe=(item.id||Date.now().toString()).replace(/[^a-zA-Z0-9_-]/g,'');
        const path=`assets/clientes/${safe}.${ext}`;
        const existing=await getGithubFile(path);
        await putContent(path,Buffer.from(match[2],'base64'),`Adiciona logo de cliente: ${item.nome||safe}`,existing?.sha);
        item.arquivo=`/${path}`;
      }
      delete item.upload;
      next.push(item);
    }
    await putContent(DATA_PATH,JSON.stringify(next,null,2),'Atualiza logos de clientes pelo painel 107',current?.sha);
    return res.status(200).json({ok:true,items:next});
  }catch(error){return res.status(500).json({error:error.message||'Erro interno.'})}
}
