/**
 * Módulo de Métricas de Conexão, Ping/RTT e Network Information API
 */

export function getNetworkInformation() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!conn) {
    return {
      supported: false,
      message: 'Network Information API não suportada neste navegador (disponível em navegadores baseados em Chromium).'
    };
  }

  return {
    supported: true,
    effectiveType: conn.effectiveType ? conn.effectiveType.toUpperCase() : 'N/A',
    downlink: conn.downlink !== undefined ? `${conn.downlink} Mbps` : 'N/A',
    downlinkRaw: conn.downlink,
    rtt: conn.rtt !== undefined ? `${conn.rtt} ms` : 'N/A',
    rttRaw: conn.rtt,
    saveData: !!conn.saveData,
    type: conn.type || 'desconhecido'
  };
}

export async function measurePing(iterations = 4, onProgress = null) {
  const pings = [];
  const pingEndpoint = 'https://zjonathas.com.br/cdn-cgi/trace';

  // Warm-up ping para abrir socket TCP/TLS e evitar viés do handshake inicial
  try {
    await fetch(`${pingEndpoint}?warmup=${Date.now()}`, {
      cache: 'no-store',
      mode: 'cors'
    });
  } catch (e) {
    // Falha silenciosa no warm-up
  }

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      const res = await fetch(`${pingEndpoint}?ping=${Date.now()}_${i}`, {
        cache: 'no-store',
        mode: 'cors'
      });
      if (res.ok) {
        const duration = Math.max(1, Math.round(performance.now() - start));
        pings.push(duration);
        if (typeof onProgress === 'function') {
          onProgress(i + 1, duration, iterations);
        }
      }
    } catch (err) {
      // Se falhar o endpoint primário, tentar 1.1.1.1
      try {
        const fallbackStart = performance.now();
        await fetch(`https://1.1.1.1/cdn-cgi/trace?ping=${Date.now()}_${i}`, {
          cache: 'no-store',
          mode: 'cors'
        });
        const duration = Math.max(1, Math.round(performance.now() - fallbackStart));
        pings.push(duration);
        if (typeof onProgress === 'function') {
          onProgress(i + 1, duration, iterations);
        }
      } catch (err2) {
        // Ignora amostra perdida
      }
    }

    // Pequena pausa entre amostras
    await new Promise((r) => setTimeout(r, 90));
  }

  if (pings.length === 0) {
    return {
      success: false,
      error: 'Não foi possível medir a latência com o endpoint de borda.',
      samples: [],
      avg: null,
      min: null,
      max: null,
      jitter: null,
      rating: 'Indisponível'
    };
  }

  const min = Math.min(...pings);
  const max = Math.max(...pings);
  const sum = pings.reduce((acc, val) => acc + val, 0);
  const avg = Math.round(sum / pings.length);

  // Cálculo de jitter (média das diferenças absolutas consecutivas)
  let jitterSum = 0;
  for (let i = 1; i < pings.length; i++) {
    jitterSum += Math.abs(pings[i] - pings[i - 1]);
  }
  const jitter = pings.length > 1 ? Math.round((jitterSum / (pings.length - 1)) * 10) / 10 : 0;

  let rating = 'Excelente';
  let ratingColor = 'emerald';
  if (avg > 150) {
    rating = 'Alto / Lento';
    ratingColor = 'rose';
  } else if (avg > 80) {
    rating = 'Moderado';
    ratingColor = 'amber';
  } else if (avg > 35) {
    rating = 'Bom';
    ratingColor = 'cyan';
  }

  return {
    success: true,
    samples: pings,
    avg,
    min,
    max,
    jitter,
    rating,
    ratingColor
  };
}
