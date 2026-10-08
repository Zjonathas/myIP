/**
 * Módulo de Telemetria de Borda e Protocolos (Cloudflare /cdn-cgi/trace)
 */

import { resolveCloudflareColo } from './cloudflarePoP.js';

export function parseTraceText(text) {
  const result = {};
  if (!text) return result;
  
  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      result[key] = val;
    }
  }
  return result;
}

export async function fetchEdgeTelemetry() {
  // Ordem de prioridade dos endpoints
  const endpoints = [
    { url: 'https://zjonathas.com.br/cdn-cgi/trace', name: 'zjonathas.com.br (Edge Primário)' },
    { url: '/cdn-cgi/trace', name: 'Domínio Local (/cdn-cgi/trace)' },
    { url: 'https://1.1.1.1/cdn-cgi/trace', name: '1.1.1.1 (Cloudflare Edge)' }
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(ep.url, {
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const text = await res.text();
        const parsed = parseTraceText(text);

        if (parsed.colo || parsed.http || parsed.tls) {
          const coloInfo = resolveCloudflareColo(parsed.colo);
          
          return {
            success: true,
            endpoint: ep.name,
            raw: text,
            httpProtocol: parsed.http ? parsed.http.toUpperCase() : 'HTTP/2',
            tlsVersion: parsed.tls || 'TLSv1.3',
            coloCode: parsed.colo || 'N/A',
            coloDetails: coloInfo,
            sni: parsed.sni || 'N/A',
            kex: parsed.kex || 'N/A',
            warp: parsed.warp === 'on',
            clientIp: parsed.ip || null,
            gateway: parsed.gateway || 'off',
            timestamp: parsed.ts ? new Date(parseFloat(parsed.ts) * 1000).toISOString() : new Date().toISOString()
          };
        }
      }
    } catch (e) {
      // Tentar próximo endpoint
    }
  }

  return {
    success: false,
    error: 'Não foi possível consultar os endpoints de telemetria de borda.',
    httpProtocol: 'Indisponível',
    tlsVersion: 'Indisponível',
    coloCode: 'N/A',
    coloDetails: null
  };
}
