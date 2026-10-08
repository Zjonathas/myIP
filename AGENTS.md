# 🤖 Diretrizes Operacionais e Catálogo de Skills (AGENTS.md)

Este repositório segue convenções estritas de desenvolvimento client-side, arquitetura modular e excelência visual. Todos os agentes e modelos de IA que operarem neste projeto **DEVEM** aderir às regras estabelecidas neste documento.

---

## ⚠️ Regra Mandatória: Leitura Prévia de Skills

> **OBRIGATÓRIO:** Antes de planejar, refatorar, escrever testes ou implementar qualquer funcionalidade neste repositório, o agente deve obrigatoriamente inspecionar os arquivos `SKILL.md` correspondentes em `.agents/skills/<nome-da-skill>/SKILL.md` e seguir integralmente suas convenções de design, arquitetura e boas práticas.

---

## 📚 Skills Disponíveis no Projeto

As seguintes skills estão instaladas e disponíveis no diretório [`.agents/skills/`](file:///c:/Users/jonat/Desktop/MeusProjetos/myIP/.agents/skills):

| Skill | Localização | Escopo & Aplicação |
| :--- | :--- | :--- |
| **`tailwind-design-system`** | [`.agents/skills/tailwind-design-system/SKILL.md`](file:///c:/Users/jonat/Desktop/MeusProjetos/myIP/.agents/skills/tailwind-design-system/SKILL.md) | Padrões de design tokens, componentes acessíveis, responsividade e Dark Mode com Tailwind CSS. |
| **`ui-ux-designer`** | [`.agents/skills/ui-ux-designer/SKILL.md`](file:///c:/Users/jonat/Desktop/MeusProjetos/myIP/.agents/skills/ui-ux-designer/SKILL.md) | Princípios de UI/UX profissional, micro-interações, hierarquia visual, acessibilidade (WCAG 2.1 AA) e estética de alta fidelidade (NOC Dashboard). |
| **`network-engineer`** | [`.agents/skills/network-engineer/SKILL.md`](file:///c:/Users/jonat/Desktop/MeusProjetos/myIP/.agents/skills/network-engineer/SKILL.md) | Protocolos de rede (IPv4, IPv6, BGP, ASN, TLSv1.3, HTTP/2 e HTTP/3, WebRTC ICE candidates, RTT e Jitter). |
| **`modern-javascript-patterns`**| [`.agents/skills/modern-javascript-patterns/SKILL.md`](file:///c:/Users/jonat/Desktop/MeusProjetos/myIP/.agents/skills/modern-javascript-patterns/SKILL.md)| JavaScript ES6+ moderno, programação assíncrona, tolerância a falhas, AbortController e arquitetura modular limpa. |

---

## 🎯 Diretrizes Técnicas e de Arquitetura

1. **100% Client-Side:**
   - A aplicação é hospedada no **GitHub Pages** e acelerada via Cloudflare.
   - Não depende e não deve introduzir servidores backend próprios.
   - Toda comunicação deve usar APIs do navegador e serviços públicos com CORS aberto.

2. **Resiliência e Fallback:**
   - Requisições a endpoints externos devem sempre possuir timeouts curtos via `AbortController`.
   - APIs sujeitas a rate-limit (ex: provedores de geolocalização) devem possuir fallback transparente em cascata com indicação visual para o usuário.

3. **Design e Acessibilidade (UI/UX):**
   - Estilo **NOC / Infrastructure Operations Dashboard** em Dark Mode permanente.
   - Tipografia monoespaçada (`Fira Code`) para dados técnicos, endereços IP e métricas; fonte sem serifa (`Inter`) para textos de apoio e controles.
   - Skeletons animados durante o carregamento de métricas assíncronas.
   - Feedback instantâneo para ações de cópia (Toasts, alterações visuais em botões e tooltips).
   - Suporte completo a atalhos de teclado (`R` = Recarregar, `C` = Copiar IP, `E` = Exportar, `ESC` = Fechar modal).

4. **Preservação de Código e Modularidade:**
   - Manter a separação de responsabilidades em `js/modules/`.
   - Validar sintaxe com `node --check` em qualquer alteração de scripts.
