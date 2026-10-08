/**
 * Módulo de Detecção de Endereçamento IP (IPv4 e IPv6)
 */

async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function detectIPv4() {
  const endpoints = [
    'https://api4.ipify.org?format=json',
    'https://api.ipify.org?format=json',
    'https://ipv4.icanhazip.com'
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetchWithTimeout(endpoint, { cache: 'no-store' }, 4000);
      if (res.ok) {
        if (endpoint.includes('icanhazip')) {
          const text = (await res.text()).trim();
          if (text) return { ip: text, source: 'icanhazip (IPv4)' };
        } else {
          const data = await res.json();
          if (data && data.ip) return { ip: data.ip.trim(), source: 'ipify (IPv4)' };
        }
      }
    } catch (e) {
      // Tentar próximo endpoint de fallback
    }
  }

  return { ip: null, error: 'Não foi possível detectar IPv4 público' };
}

export async function detectIPv6() {
  const endpoints = [
    'https://api6.ipify.org?format=json',
    'https://ipv6.icanhazip.com'
  ];

  for (const endpoint of endpoints) {
    try {
      // Timeout mais agressivo (2.5s) para conexões sem suporte a IPv6
      const res = await fetchWithTimeout(endpoint, { cache: 'no-store' }, 2500);
      if (res.ok) {
        if (endpoint.includes('icanhazip')) {
          const text = (await res.text()).trim();
          if (text && text.includes(':')) {
            return { ip: text, supported: true, source: 'icanhazip (IPv6)' };
          }
        } else {
          const data = await res.json();
          if (data && data.ip && data.ip.includes(':')) {
            return { ip: data.ip.trim(), supported: true, source: 'ipify (IPv6)' };
          }
        }
      }
    } catch (e) {
      // Falha esperada caso a rede não possua IPv6 nativo
    }
  }

  return { ip: null, supported: false, error: 'Sem conectividade IPv6 detectada' };
}

export async function detectDualStackIP() {
  try {
    const res = await fetchWithTimeout('https://api64.ipify.org?format=json', { cache: 'no-store' }, 3500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        const isV6 = data.ip.includes(':');
        return {
          ip: data.ip.trim(),
          type: isV6 ? 'IPv6' : 'IPv4',
          source: 'api64.ipify.org'
        };
      }
    }
  } catch (e) {
    // Falha silenciosa
  }
  return null;
}

export async function detectIPs() {
  const [ipv4Result, ipv6Result, dualStackResult] = await Promise.allSettled([
    detectIPv4(),
    detectIPv6(),
    detectDualStackIP()
  ]);

  const ipv4 = ipv4Result.status === 'fulfilled' ? ipv4Result.value : { ip: null, error: 'Erro de rede' };
  const ipv6 = ipv6Result.status === 'fulfilled' ? ipv6Result.value : { ip: null, supported: false, error: 'Erro de rede' };
  const dual = dualStackResult.status === 'fulfilled' ? dualStackResult.value : null;

  const primaryIp = ipv4.ip || (ipv6.supported ? ipv6.ip : (dual ? dual.ip : 'Desconhecido'));

  return {
    primaryIp,
    ipv4,
    ipv6,
    dual
  };
}
