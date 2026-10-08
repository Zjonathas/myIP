# 🌐 Network Diagnostics & IP Inspector

A modern, lightweight, 100% client-side web tool for real-time network diagnostics and connectivity inspection. Hosted directly via GitHub Pages and accelerated with Cloudflare.

🔗 **Live Demo:** [MyIP](https://myip.zjonathas.com.br)

---

## 🚀 Features

- **IP Detection:** Automatic lookup for public IPv4 and IPv6 addresses.
- **Routing & ISP:** Instant lookup of ASN, ISP/operator name, and approximate geographic location.
- **Protocol & TLS:** Detection of active HTTP protocol versions (HTTP/2, HTTP/3) and TLS cipher suites.
- **Connection Metrics:** Estimated latency (RTT), jitter, and link information via the `Network Information API`.
- **Client Diagnostics:** Formatted User-Agent, system architecture, display resolution, and WebGL hardware renderer details.
- **Quick Export:** One-click copy button to export clean diagnostic summaries for IT support tickets.

---

## 🛠️ Built With

- **Frontend:** HTML5, Modern JavaScript (ES6+), Tailwind CSS
- **Hosting:** GitHub Pages
- **DNS & CDN:** Cloudflare (SSL/TLS, Caching, and `/cdn-cgi/trace`)
- **Telemetry APIs:** Public APIs and edge endpoints for network telemetry

---

## 💻 Getting Started Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/Zjonathas/myIP.git
   cd myIP
   ```

2. Execute localmente com qualquer servidor estático HTTP:
   ```bash
   # Via Python:
   python -m http.server 8080

   # Ou via Node.js:
   npx serve .
   ```

3. Acesse no navegador:
   `http://localhost:8080`

---

## ⌨️ Atalhos de Teclado

- **`R`**: Recarregar todos os testes de diagnóstico em tempo real
- **`C`**: Copiar endereço IP público primário para a área de transferência
- **`E`**: Abrir modal de exportação de relatório técnico
- **`ESC`**: Fechar modal ativo

---

## 📄 Licença

Distribuído sob a licença MIT.