const OWNER=process.env.GITHUB_OWNER||'nandovent';
const REPO=process.env.GITHUB_REPO||'107std';
const BRANCH=process.env.GITHUB_BRANCH||'main';
const DATA_PATH='data/producao.json';
const ghHeaders=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${process.env.GITHUB_TOKEN}`,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'107std-producao'});
const authorized=req=>Boolean(process.env.ADMIN_PASSWORD&&req.headers['x-admin-password']===process.env.ADMIN_PASSWORD);
async function getFile(path){const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${encodeURIComponent(BRANCH)}`;const r=await fetch(url,{headers:ghHeaders()});if(r.status===404)return null;if(!r.ok)throw new Error(`GitHub GET ${r.status}`);const d=await r.json(),buf=Buffer.from(String(d.content||'').replace(/\n/g,''),'base64');return{sha:d.sha,buffer:buf,text:buf.toString('utf8')}}
async function putFile(path,content,message,sha){const url=`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;const payload={message,content:(Buffer.isBuffer(content)?content:Buffer.from(content)).toString('base64'),branch:BRANCH};if(sha)payload.sha=sha;const r=await fetch(url,{method:'PUT',headers:{...ghHeaders(),'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.message||`GitHub PUT ${r.status}`);return d}
function cleanId(v){return String(v||'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80)}
function mimeExt(data){const m=String(data||'').match(/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/);if(!m)return null;return{ext:m[1]==='jpeg'?'jpg':m[1],buf:Buffer.from(m[2],'base64')}}
export const config={api:{bodyParser:{sizeLimit:'6mb'}}};
export default async function handler(req,res){res.setHeader('Cache-Control','no-store');try{
 if(!authorized(req))return res.status(401).json({error:'Senha inválida.'});
 if(!process.env.GITHUB_TOKEN)return res.status(500).json({error:'GITHUB_TOKEN não configurado.'});
 if(req.method==='GET'){
   const file=await getFile(DATA_PATH);if(!file)return res.status(200).json({version:5,inventory:[],templates:[],lists:[],inventoryDraft:[]});
   return res.status(200).json(JSON.parse(file.text));
 }
 if(req.method==='POST'&&req.query?.action==='photo'){
   const id=cleanId(req.body?.id),parsed=mimeExt(req.body?.data);if(!id||!parsed)return res.status(400).json({error:'Foto inválida.'});
   if(parsed.buf.length>2_500_000)return res.status(413).json({error:'Foto muito grande.'});
   const path=`assets/inventario/${id}.${parsed.ext}`,current=await getFile(path);await putFile(path,parsed.buf,`Atualiza foto do inventário: ${id}`,current?.sha);
   return res.status(200).json({ok:true,path:`/${path}?v=${Date.now()}`});
 }
 if(req.method==='PUT'){
   const incoming=req.body;if(!incoming||!Array.isArray(incoming.inventory)||!Array.isArray(incoming.templates)||!Array.isArray(incoming.lists))return res.status(400).json({error:'Dados inválidos.'});
   const text=JSON.stringify(incoming,null,2);if(Buffer.byteLength(text)>1_500_000)return res.status(413).json({error:'Cadastro muito grande.'});
   const current=await getFile(DATA_PATH);await putFile(DATA_PATH,text,'Atualiza produção e inventário 107',current?.sha);return res.status(200).json({ok:true});
 }
 res.setHeader('Allow','GET, PUT, POST');return res.status(405).json({error:'Método não permitido.'});
}catch(e){console.error(e);return res.status(500).json({error:'Não foi possível salvar o sistema de produção.',detail:process.env.NODE_ENV==='development'?String(e.message||e):undefined})}}
