/**
 * Módulo de Geolocalização de IP e Resolução de ASN / ISP
 * Implementa estratégia resiliente de fallback em cascata com detecção de rate-limiting.
 */

async function fetchWithTimeout(url, options = {}, timeoutMs = 4500) {
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

export async function fetchGeoLocation(targetIp = '') {
  const attempts = [];

  // 1. Provedor Primário: freeipapi.com (Rápido, sem rate limit rígido, CORS aberto)
  try {
    const url = targetIp ? `https://freeipapi.com/api/json/${targetIp}` : 'https://freeipapi.com/api/json';
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 4500);
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryName) {
        return {
          success: true,
          ip: data.ipAddress,
          isp: data.asnOrganization || 'Desconhecido',
          asn: data.asn ? (String(data.asn).startsWith('AS') ? data.asn : `AS${data.asn}`) : 'N/A',
          org: data.asnOrganization || '',
          city: data.cityName || 'Desconhecido',
          region: data.regionName || '',
          country: data.countryName || 'Desconhecido',
          countryCode: data.countryCode || '',
          flagUrl: data.countryCode ? `https://flagcdn.com/w80/${data.countryCode.toLowerCase()}.png` : null,
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
          timezone: Array.isArray(data.timeZones) ? data.timeZones[0] : (data.timeZones || 'UTC'),
          source: 'freeipapi.com',
          isFallback: false,
          fallbackReason: null
        };
      } else {
        attempts.push('freeipapi: Dados incompletos');
      }
    } else {
      attempts.push(`freeipapi: HTTP ${res.status}`);
    }
  } catch (err) {
    attempts.push(`freeipapi: ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
  }

  // 2. Fallback Secundário: ipwhois.app
  try {
    const url = targetIp ? `https://ipwhois.app/json/${targetIp}` : 'https://ipwhois.app/json/';
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 4500);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.success !== false) && data.country) {
        return {
          success: true,
          ip: data.ip,
          isp: data.isp || data.org || 'Desconhecido',
          asn: data.asn || 'N/A',
          org: data.org || data.isp || '',
          city: data.city || 'Desconhecido',
          region: data.region || '',
          country: data.country || 'Desconhecido',
          countryCode: data.country_code || '',
          flagUrl: data.country_flag || null,
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
          timezone: data.timezone || data.timezone_gmt || 'UTC',
          source: 'ipwhois.app (Fallback 1)',
          isFallback: true,
          fallbackReason: `Provedor primário falhou (${attempts.join('; ')})`
        };
      } else {
        attempts.push(`ipwhois.app: ${data.message || 'Dados inválidos'}`);
      }
    } else {
      attempts.push(`ipwhois.app: HTTP ${res.status}`);
    }
  } catch (err) {
    attempts.push(`ipwhois.app: ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
  }

  // 3. Fallback Terciário: ipapi.co (com tratamento específico de 429 Rate Limit)
  try {
    const url = targetIp ? `https://ipapi.co/${targetIp}/json/` : 'https://ipapi.co/json/';
    const res = await fetchWithTimeout(url, { cache: 'no-store' }, 4000);
    if (res.status === 429) {
      attempts.push('ipapi.co: Rate limit excedido (HTTP 429)');
    } else if (res.ok) {
      const data = await res.json();
      if (!data.error && data.country_name) {
        return {
          success: true,
          ip: data.ip,
          isp: data.org || 'Desconhecido',
          asn: data.asn || 'N/A',
          org: data.org || '',
          city: data.city || 'Desconhecido',
          region: data.region || '',
          country: data.country_name || 'Desconhecido',
          countryCode: data.country_code || '',
          flagUrl: data.country_code ? `https://flagcdn.com/w80/${data.country_code.toLowerCase()}.png` : null,
          latitude: parseFloat(data.latitude) || null,
          longitude: parseFloat(data.longitude) || null,
          timezone: data.timezone || 'UTC',
          source: 'ipapi.co (Fallback 2)',
          isFallback: true,
          fallbackReason: `Fallback secundário ativado (${attempts.join('; ')})`
        };
      } else {
        attempts.push(`ipapi.co: ${data.reason || 'Erro na resposta'}`);
      }
    } else {
      attempts.push(`ipapi.co: HTTP ${res.status}`);
    }
  } catch (err) {
    attempts.push(`ipapi.co: ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
  }

  // Se todos os provedores falharam
  return {
    success: false,
    error: 'Falha na consulta de geolocalização IP em todos os provedores.',
    details: attempts,
    source: 'Nenhum provedor disponível',
    isFallback: true,
    fallbackReason: `Tentativas falharam: ${attempts.join(' | ')}`
  };
}
