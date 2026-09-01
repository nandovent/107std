const OWNER=process.env.GITHUB_OWNER||'nandovent';
const REPO=process.env.GITHUB_REPO||'107std';
const BRANCH=process.env.GITHUB_BRANCH||'main';
const DATA_PATH='data/propostas.json';
const PROPOSAL_PASSWORD='107';

const ghHeaders=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${process.env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'107std-admin'});

async function getGithubFile(path){
  const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`;
  const response=await fetch(url,{headers:ghHeaders()});
  if(response.status===404)return null;
  if(!response.ok)throw new Error(`GitHub GET ${response.status}`);
  const data=await response.json();
  const buffer=Buffer.from(String(data.content||'').replace(/\n/g,''),'base64');
  return {sha:data.sha,content:buffer.toString('utf8')};
}

async function putContent(path,content,message,sha){
  const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const payload={message,content:Buffer.from(content,'utf8').toString('base64'),branch:BRANCH};
  if(sha)payload.sha=sha;
  const response=await fetch(url,{method:'PUT',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data=await response.json();
  if(!response.ok)throw new Error(data.message||'Erro ao salvar no GitHub.');
  return data;
}

async function deleteContent(path,message){
  const current=await getGithubFile(path);if(!current)return;
  const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const response=await fetch(url,{method:'DELETE',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify({message,sha:current.sha,branch:BRANCH})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.message||'Erro ao excluir do GitHub.');
}

const cleanSlug=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.html$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function protectHtml(raw,nome){
  let html=String(raw||'').trim();
  if(!html)throw new Error('HTML vazio.');
  if(!/<html[\s>]/i.test(html))throw new Error('O arquivo enviado não parece ser um HTML completo.');
  const meta='<meta name="robots" content="noindex,nofollow,noarchive,nosnippet">';
  const lockStyle=`<style id="107-proposal-lock-style">#proposal-107-lock{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:#101010;color:#FCFAE3;font-family:Montserrat,Arial,sans-serif}#proposal-107-lock *{box-sizing:border-box}.p107-card{width:min(440px,100%);padding:30px;border:1px solid rgba(252,250,227,.16);border-radius:28px;background:#171717;box-shadow:0 24px 80px rgba(0,0,0,.35)}.p107-mark{color:#EF431D;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:900}.p107-card h1{margin:14px 0 8px;font-size:34px;line-height:.92;letter-spacing:-.05em;text-transform:uppercase;font-weight:900}.p107-card p{margin:0 0 22px;color:#AAA89B;font-size:13px;line-height:1.5;font-weight:600}.p107-row{display:flex;gap:8px}.p107-row input{min-width:0;flex:1;padding:14px 15px;border:1px solid rgba(252,250,227,.16);border-radius:14px;background:#222;color:#FCFAE3;font:800 16px Montserrat,Arial,sans-serif;outline:none}.p107-row input:focus{border-color:#EF431D}.p107-row button{border:0;border-radius:14px;padding:0 18px;background:#EF431D;color:#FCFAE3;font:900 11px Montserrat,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.p107-error{min-height:18px;margin-top:10px;color:#ff8f78;font-size:11px;font-weight:700}body.p107-locked{overflow:hidden!important}</style>`;
  const lock=`<div id="proposal-107-lock" role="dialog" aria-modal="true" aria-label="Acesso à proposta"><div class="p107-card"><div class="p107-mark">107 STUDIOS • PROPOSTA</div><h1>${escapeHtml(nome||'Proposta comercial')}</h1><p>Digite a senha enviada junto com este link para visualizar a proposta.</p><div class="p107-row"><input id="p107-password" type="password" inputmode="numeric" autocomplete="off" placeholder="Senha" aria-label="Senha"><button id="p107-enter" type="button">Entrar</button></div><div class="p107-error" id="p107-error"></div></div></div>`;
  const script=`<script id="107-proposal-lock-script">(()=>{const KEY='107_proposal_access';const PASS='${PROPOSAL_PASSWORD}';const unlock=()=>{document.body.classList.remove('p107-locked');document.getElementById('proposal-107-lock')?.remove()};const check=()=>{const input=document.getElementById('p107-password');const err=document.getElementById('p107-error');if((input?.value||'')===PASS){sessionStorage.setItem(KEY,'1');unlock()}else{if(err)err.textContent='Senha incorreta.';input?.focus();input?.select()}};document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('p107-locked');if(sessionStorage.getItem(KEY)==='1'){unlock();return}document.getElementById('p107-enter')?.addEventListener('click',check);document.getElementById('p107-password')?.addEventListener('keydown',e=>{if(e.key==='Enter')check()});document.getElementById('p107-password')?.focus()})})();</script>`;
  if(/<head[^>]*>/i.test(html))html=html.replace(/<head([^>]*)>/i,`<head$1>${meta}${lockStyle}`);else html=meta+lockStyle+html;
  if(/<body[^>]*>/i.test(html))html=html.replace(/<body([^>]*)>/i,`<body$1>${lock}`);else html=lock+html;
  if(/<\/body>/i.test(html))html=html.replace(/<\/body>/i,`${script}</body>`);else html+=script;
  return html;
}

export const config={api:{bodyParser:{sizeLimit:'4mb'}}};

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(!process.env.ADMIN_PASSWORD||req.headers['x-admin-password']!==process.env.ADMIN_PASSWORD)return res.status(401).json({error:'Senha inválida.'});
  if(!process.env.GITHUB_TOKEN)return res.status(500).json({error:'GITHUB_TOKEN não configurado.'});
  try{
    const dataFile=await getGithubFile(DATA_PATH);
    let items=dataFile?JSON.parse(dataFile.content):[];
    if(req.method==='GET')return res.status(200).json(items);
    if(req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body||!body.action)return res.status(400).json({error:'Ação inválida.'});
    if(body.action==='upsert'){
      const nome=String(body.nome||'').trim();const slug=cleanSlug(body.slug);const raw=String(body.html||'');
      if(!nome)return res.status(400).json({error:'Nome da proposta obrigatório.'});
      if(!slug)return res.status(400).json({error:'Nome de arquivo inválido.'});
      if(raw.length>3000000)return res.status(413).json({error:'HTML muito grande. Limite de 3 MB.'});
      const path=`propostas/${slug}.html`;const current=await getGithubFile(path);const protectedHtml=protectHtml(raw,nome);
      await putContent(path,protectedHtml,`${current?'Atualiza':'Publica'} proposta: ${nome}`,current?.sha);
      const now=new Date().toISOString();const existing=items.find(x=>x.slug===slug);
      if(existing){existing.nome=nome;existing.arquivo=path;existing.updatedAt=now}else items.push({id:`prop_${Date.now()}`,nome,slug,arquivo:path,createdAt:now,updatedAt:now});
      await putContent(DATA_PATH,JSON.stringify(items,null,2),'Atualiza índice de propostas 107',dataFile?.sha);
      return res.status(200).json({ok:true,slug,arquivo:path});
    }
    if(body.action==='delete'){
      const slug=cleanSlug(body.slug);if(!slug)return res.status(400).json({error:'Proposta inválida.'});
      await deleteContent(`propostas/${slug}.html`, `Exclui proposta: ${slug}`);
      items=items.filter(x=>x.slug!==slug);
      const latestData=await getGithubFile(DATA_PATH);
      await putContent(DATA_PATH,JSON.stringify(items,null,2),'Remove proposta do índice 107',latestData?.sha);
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:'Ação desconhecida.'});
  }catch(error){return res.status(500).json({error:error.message||'Erro interno.'})}
}
