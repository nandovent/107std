const loginCard=document.querySelector('#login-card');
const app=document.querySelector('#admin-app');
const passwordInput=document.querySelector('#password');
const loginBtn=document.querySelector('#login');
const loginStatus=document.querySelector('#login-status');
const statusEl=document.querySelector('#status');
const listEl=document.querySelector('#proposal-list');
const nameInput=document.querySelector('#proposal-name');
const linkPreview=document.querySelector('#proposal-link-preview');
const fileInput=document.querySelector('#proposal-file');
const publishBtn=document.querySelector('#publish-proposal');
let password=sessionStorage.getItem('107_admin_password')||'';
let items=[];

const setStatus=(msg,type='')=>{statusEl.textContent=msg;statusEl.className='status '+type};
const cleanSlug=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\.html$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80);
const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const proposalUrl=slug=>`${location.origin}/propostas/${encodeURIComponent(slug)}.html`;

const api=async(method='GET',body)=>{
  const response=await fetch('/api/propostas',{method,headers:{'Content-Type':'application/json','x-admin-password':password},body:body?JSON.stringify(body):undefined});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Erro na API');
  return data;
};

const readFile=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(new Error('Não foi possível ler o HTML.'));reader.readAsText(file,'utf-8')});

const copyText=async(text,button)=>{
  try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent='Link copiado ✓';setTimeout(()=>button.textContent=old,1600)}
  catch{window.prompt('Copie o link:',text)}
};

const render=()=>{
  if(!items.length){listEl.innerHTML='<div class="proposal-empty"><strong>Nenhuma proposta publicada.</strong>Suba o primeiro HTML acima.</div>';return}
  listEl.innerHTML=items.slice().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||''))).map(item=>{
    const url=proposalUrl(item.slug);
    return `<article class="proposal-editor" data-slug="${escapeHtml(item.slug)}"><div class="proposal-editor-head"><div><strong>${escapeHtml(item.nome||item.slug)}</strong><small>${escapeHtml(item.arquivo||`propostas/${item.slug}.html`)}</small></div></div><div class="proposal-link">${escapeHtml(url)}</div><div class="proposal-actions"><a href="${escapeHtml(url)}" target="_blank">Abrir proposta</a><button class="ghost copy-link" type="button">Copiar link</button><button class="ghost replace-proposal" type="button">Substituir HTML</button><button class="danger delete-proposal" type="button">Excluir</button><input class="replace-file" type="file" accept="text/html,.html" hidden></div></article>`
  }).join('');
  listEl.querySelectorAll('.proposal-editor').forEach(card=>{
    const slug=card.dataset.slug;const item=items.find(x=>x.slug===slug);const url=proposalUrl(slug);
    card.querySelector('.copy-link').onclick=e=>copyText(url,e.currentTarget);
    const replaceFile=card.querySelector('.replace-file');
    card.querySelector('.replace-proposal').onclick=()=>replaceFile.click();
    replaceFile.onchange=async()=>{const file=replaceFile.files?.[0];if(!file)return;try{setStatus('Lendo e publicando nova versão...');const html=await readFile(file);await api('POST',{action:'upsert',nome:item.nome,slug:item.slug,html});setStatus('HTML substituído. A Vercel vai atualizar em instantes.','ok');await load()}catch(error){setStatus(error.message,'error')}finally{replaceFile.value=''}};
    card.querySelector('.delete-proposal').onclick=async()=>{if(!confirm(`Excluir a proposta “${item.nome||slug}”?`))return;try{setStatus('Excluindo proposta...');await api('POST',{action:'delete',slug});setStatus('Proposta excluída.','ok');await load()}catch(error){setStatus(error.message,'error')}};
  });
};

const load=async()=>{setStatus('Carregando...');try{items=await api();render();setStatus(`${items.length} proposta${items.length===1?'':'s'} carregada${items.length===1?'':'s'}.`,'ok')}catch(error){setStatus(error.message,'error');if(error.message.includes('Senha')){sessionStorage.removeItem('107_admin_password');app.hidden=true;loginCard.hidden=false}}};

loginBtn.onclick=async()=>{password=passwordInput.value;loginStatus.textContent='Entrando...';try{await api();sessionStorage.setItem('107_admin_password',password);loginCard.hidden=true;app.hidden=false;loginStatus.textContent='';load()}catch(error){loginStatus.textContent=error.message;loginStatus.className='status error'}};

nameInput.addEventListener('input',()=>{const slug=cleanSlug(nameInput.value);linkPreview.textContent=slug?`${location.origin}/propostas/${slug}.html`:''});

document.querySelector('#clear-form').onclick=()=>{nameInput.value='';linkPreview.textContent='';fileInput.value=''};
document.querySelector('#reload').onclick=load;
publishBtn.onclick=async()=>{
  const nome=nameInput.value.trim();const slug=cleanSlug(nome);const file=fileInput.files?.[0];
  if(!nome)return setStatus('Informe o nome da proposta.','error');
  if(!slug)return setStatus('Informe um nome de proposta válido.','error');
  if(!file)return setStatus('Selecione o arquivo HTML final.','error');
  publishBtn.disabled=true;setStatus('Publicando proposta no GitHub...');
  try{const html=await readFile(file);await api('POST',{action:'upsert',nome,slug,html});setStatus('Publicado. Copie o link na lista abaixo assim que a Vercel concluir o deploy.','ok');nameInput.value='';linkPreview.textContent='';fileInput.value='';await load()}
  catch(error){setStatus(error.message,'error')}
  finally{publishBtn.disabled=false}
};

if(password){loginCard.hidden=true;app.hidden=false;load()}
