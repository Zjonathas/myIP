/**
 * Módulo de Exportação e Formatação de Diagnósticos (v2.1)
 * Gera relatórios técnicos em Texto Puro (para tickets), Markdown (para Jira/GitHub) e JSON.
 */

export function generatePlainTextReport(state) {
  const now = new Date();
  const dateStr = now.toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'medium' });
  
  const geo = state.geo || {};
  const ip = state.ip || {};
  const edge = state.edge || {};
  const latency = state.latency || {};
  const netInfo = state.netInfo || {};
  const display = state.display || {};
  const ua = state.ua || {};
  const gpu = state.gpu || {};
  const webrtc = state.webrtc || {};

  return `================================================================================
          NETWORK DIAGNOSTICS & IP INSPECTOR — RELATÓRIO TÉCNICO
================================================================================
Data e Hora:       ${dateStr}
Timestamp ISO:     ${now.toISOString()}
Origem / Host:     ${window.location.origin || 'Client-Side App'}
--------------------------------------------------------------------------------

[1] ENDEREÇAMENTO IP & ROTEAMENTO
--------------------------------------------------------------------------------
IPv4 Público:      ${ip.ipv4?.ip || 'Não detectado'}
IPv6 Público:      ${ip.ipv6?.ip || (ip.ipv6?.supported === false ? 'Não detectado (sem suporte IPv6 na rede)' : 'N/A')}
Endereço Primário: ${ip.primaryIp || 'N/A'}
Provedor / ISP:    ${geo.isp || 'N/A'}
Organização (BGP): ${geo.org || 'N/A'}
ASN:               ${geo.asn || 'N/A'}
Localidade:        ${[geo.city, geo.region, geo.country].filter(Boolean).join(', ') || 'N/A'}
Código do País:    ${geo.countryCode || 'N/A'}
Coordenadas GPS:   ${geo.latitude && geo.longitude ? `${geo.latitude}, ${geo.longitude}` : 'N/A'}
Fuso Horário:      ${geo.timezone || 'N/A'}
Fonte Geográfica:  ${geo.source || 'N/A'} ${geo.isFallback ? `[Fallback: ${geo.fallbackReason || 'Ativado'}]` : ''}

[2] TELEMETRIA DE BORDA (CLOUDFLARE EDGE)
--------------------------------------------------------------------------------
Protocolo HTTP:    ${edge.httpProtocol || 'N/A'}
Versão TLS:        ${edge.tlsVersion || 'N/A'}
Ponto de Presença: ${edge.coloDetails?.formatted || (edge.coloCode ? `Colo ${edge.coloCode}` : 'N/A')}
Datacenter Código: ${edge.coloCode || 'N/A'}
Troca de Chaves:   ${edge.kex || 'N/A'}
SNI:               ${edge.sni || 'N/A'}
Cloudflare WARP:   ${edge.warp ? 'Ativo' : 'Desativado'}
Endpoint Borda:    ${edge.endpoint || 'N/A'}

[3] MÉTRICAS DE LATÊNCIA & REDE
--------------------------------------------------------------------------------
Latência Média:    ${latency.avg !== null ? `${latency.avg} ms (${latency.rating})` : 'N/A'}
Mínimo / Máximo:   ${latency.min !== null ? `${latency.min} ms / ${latency.max} ms` : 'N/A'}
Jitter (Variação): ${latency.jitter !== null ? `${latency.jitter} ms` : 'N/A'}
Amostras RTT:      ${latency.samples?.length ? latency.samples.join(', ') + ' ms' : 'N/A'}
Tipo Efetivo:      ${netInfo.effectiveType || 'N/A'} (Network Information API)
Downlink Estimado: ${netInfo.downlink || 'N/A'}
RTT de Interface:  ${netInfo.rtt || 'N/A'}
Economia de Dados: ${netInfo.saveData ? 'Sim' : 'Não'}

[4] DIAGNÓSTICO DO CLIENTE & HARDWARE
--------------------------------------------------------------------------------
Sistema Operacional: ${ua.os || 'N/A'} (${ua.architecture || 'N/A'})
Navegador Web:     ${ua.fullBrowser || ua.browser || 'N/A'}
Idioma do Sistema: ${ua.language || 'N/A'}
Núcleos de CPU:    ${ua.cpuCores || 'N/A'}
Resolução de Tela: ${display.screenResolution || 'N/A'} (Viewport: ${display.viewportResolution || 'N/A'})
Pixel Ratio (DPR): ${display.devicePixelRatio || '1x'} (${display.colorDepth || '24-bit'})
Placa Gráfica/GPU: ${gpu.renderer || 'N/A'}
Fabricante GPU:    ${gpu.vendor || 'N/A'}
Versão WebGL:      ${gpu.webglVersion || 'N/A'}
WebRTC IP Leak:    ${webrtc.status || 'N/A'}
${webrtc.leakedIps?.length ? `IPs Revelados:     ${webrtc.leakedIps.join(', ')}\n` : ''}
User-Agent Completo:
${ua.rawUserAgent || navigator.userAgent}

================================================================================
Gerado por Network Diagnostics & IP Inspector — 100% Client-Side
================================================================================`;
}

export function generateMarkdownReport(state) {
  const now = new Date();
  const dateStr = now.toLocaleString('pt-BR');

  const geo = state.geo || {};
  const ip = state.ip || {};
  const edge = state.edge || {};
  const latency = state.latency || {};
  const netInfo = state.netInfo || {};
  const display = state.display || {};
  const ua = state.ua || {};
  const gpu = state.gpu || {};
  const webrtc = state.webrtc || {};

  return `### 🌐 Relatório de Diagnóstico de Rede — Network Diagnostics & IP Inspector
*Gerado em:* \`${dateStr}\` | *Origem:* \`${window.location.origin}\`

#### 📌 1. Endereçamento IP & Roteamento
| Campo | Valor |
| :--- | :--- |
| **IPv4 Público** | \`${ip.ipv4?.ip || 'Não detectado'}\` |
| **IPv6 Público** | \`${ip.ipv6?.ip || (ip.ipv6?.supported === false ? 'Sem IPv6 nativo' : 'N/A')}\` |
| **Provedor / ISP** | ${geo.isp || 'N/A'} |
| **ASN** | \`${geo.asn || 'N/A'}\` |
| **Localização** | ${[geo.city, geo.region, geo.country].filter(Boolean).join(', ')} |
| **Coordenadas** | \`${geo.latitude && geo.longitude ? `${geo.latitude}, ${geo.longitude}` : 'N/A'}\` |
| **Fuso Horário** | ${geo.timezone || 'N/A'} |
| **Fonte Geo** | ${geo.source || 'N/A'} ${geo.isFallback ? '*(Fallback)*' : ''} |

#### ⚡ 2. Telemetria de Borda Cloudflare
- **Protocolo:** \`${edge.httpProtocol || 'N/A'}\`
- **TLS:** \`${edge.tlsVersion || 'N/A'}\`
- **PoP Datacenter:** \`${edge.coloDetails?.formatted || edge.coloCode || 'N/A'}\`
- **Cifra / Troca de Chaves:** \`${edge.kex || 'N/A'}\` (SNI: \`${edge.sni || 'N/A'}\`)

#### ⏱️ 3. Métricas de Latência & Conexão
- **RTT Médio:** \`${latency.avg !== null ? `${latency.avg} ms` : 'N/A'}\` (${latency.rating || 'N/A'})
- **Mínimo / Máximo:** \`${latency.min} ms / ${latency.max} ms\` (Jitter: \`${latency.jitter} ms\`)
- **Tipo Efetivo de Rede:** \`${netInfo.effectiveType || 'N/A'}\`
- **Downlink Estimado:** \`${netInfo.downlink || 'N/A'}\` (RTT Interface: \`${netInfo.rtt || 'N/A'}\`)

#### 💻 4. Diagnóstico do Cliente & Hardware
- **Sistema:** ${ua.os || 'N/A'} (\`${ua.architecture || 'N/A'}\`)
- **Navegador:** ${ua.fullBrowser || ua.browser || 'N/A'}
- **Display:** \`${display.screenResolution}\` (DPR: \`${display.devicePixelRatio}\`, \`${display.colorDepth}\`)
- **GPU:** \`${gpu.renderer || 'N/A'}\` (${gpu.vendor || 'N/A'})
- **WebRTC Status:** ${webrtc.status || 'N/A'}

---
*Gerado via [Network Diagnostics & IP Inspector](https://myip.zjonathas.com.br)*`;
}

export function generateJsonReport(state) {
  return JSON.stringify(
    {
      metadata: {
        app: 'Network Diagnostics & IP Inspector',
        generatedAt: new Date().toISOString(),
        url: window.location.href
      },
      ...state
    },
    null,
    2
  );
}

export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Falha ao copiar para o clipboard:', err);
    return false;
  }
}

export function downloadFile(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
