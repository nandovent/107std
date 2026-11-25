# Roadmap 107 Studios

## Em andamento
- [x] Nova home v05
- [x] Portfólio, Cases, G4 Valley, Festa da Tainha e Dados no padrão v05 — aguardando aprovação

## Próximos
- [ ] Página de Serviços — aguardando aprovação (prévia)
- [ ] Showreel de 60–90s para o topo da home
- [ ] Mais 2–3 cases no formato G4/Tainha
- [ ] Depoimentos de clientes
- [ ] **Admin › Parceiros**: página para cadastrar logos de parceiros, igual à de Clientes.
      A home já lê `data/parceiros.json` (campos: id, nome, arquivo, escala, ordem, publicado, link opcional)
      e as imagens ficam em `assets/parceiros/`. O bloco "Parcerias que fortalecem negócios" só aparece quando há logos.
- [ ] 107 OS: banco de dados (Supabase) + logins individuais
- [ ] Inventário com QR Code e status por item
- [ ] Checklist ligado ao job (saída/volta por QR)
- [ ] Propostas com senha verificada no servidor + aviso de abertura

## Como o site público está organizado
- `assets/css/site.css` — todo o visual (cores por tema: escuro, `.light`, `.orange`)
- `assets/js/site.js` — menu, animações, contadores, vídeos, equipe e logos
- `assets/js/portfolio.js` — só a página de portfólio (lê `data/portfolio.json`)
- `assets/media/` — vídeos otimizados (1080p computador, 720p celular, loops dos cards)
- Imagens de cada case ficam em `cases/<case>/assets/`
