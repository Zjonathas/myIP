/**
 * Módulo de Diagnóstico do Cliente, Dispositivo, Hardware e WebRTC
 */

export function getDisplayDiagnostics() {
  const width = window.screen.width;
  const height = window.screen.height;
  const innerWidth = window.innerWidth;
  const innerHeight = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const colorDepth = window.screen.colorDepth || 24;
  const orientation = window.screen.orientation ? window.screen.orientation.type : 'Desconhecida';

  return {
    screenResolution: `${width} × ${height} px`,
    viewportResolution: `${innerWidth} × ${innerHeight} px`,
    devicePixelRatio: `${dpr}x`,
    colorDepth: `${colorDepth}-bit`,
    orientation: orientation.replace('-', ' ').toUpperCase(),
    touchSupport: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ? 'Sim' : 'Não'
  };
}

export function parseUserAgent() {
  const ua = navigator.userAgent;
  let os = 'Desconhecido';
  let browser = 'Desconhecido';
  let version = '';
  let architecture = 'x86_64 / Desconhecido';

  // Deteção do Sistema Operacional
  if (/Windows NT 10.0/i.test(ua)) {
    // Windows 10 e Windows 11 compartilham NT 10.0 no UA
    os = 'Windows 10 / 11';
  } else if (/Windows NT 6.3/i.test(ua)) {
    os = 'Windows 8.1';
  } else if (/Windows NT 6.1/i.test(ua)) {
    os = 'Windows 7';
  } else if (/Mac OS X 1[0-9_]+/i.test(ua)) {
    const match = ua.match(/Mac OS X ([0-9_]+)/i);
    os = `macOS ${match ? match[1].replace(/_/g, '.') : ''}`.trim();
  } else if (/Android ([0-9.]+)/i.test(ua)) {
    const match = ua.match(/Android ([0-9.]+)/i);
    os = `Android ${match ? match[1] : ''}`.trim();
  } else if (/iPhone|iPad|iPod/i.test(ua)) {
    os = 'iOS / iPadOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux (Kernel Base)';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  }

  // Deteção de Arquitetura
  if (/Win64|x64|x86_64|amd64/i.test(ua) || /x86_64/i.test(navigator.platform || '')) {
    architecture = '64-bit (x86_64 / AMD64)';
  } else if (/arm64|aarch64/i.test(ua)) {
    architecture = '64-bit (ARM64)';
  } else if (/WOW64|x86|i686|i386/i.test(ua)) {
    architecture = '32-bit (x86)';
  }

  // Deteção do Navegador
  if (/Edg\/([0-9.]+)/i.test(ua)) {
    const m = ua.match(/Edg\/([0-9.]+)/i);
    browser = 'Microsoft Edge';
    version = m ? m[1] : '';
  } else if (/OPR\/([0-9.]+)/i.test(ua)) {
    const m = ua.match(/OPR\/([0-9.]+)/i);
    browser = 'Opera';
    version = m ? m[1] : '';
  } else if (/Chrome\/([0-9.]+)/i.test(ua)) {
    const m = ua.match(/Chrome\/([0-9.]+)/i);
    browser = 'Google Chrome';
    version = m ? m[1] : '';
  } else if (/Firefox\/([0-9.]+)/i.test(ua)) {
    const m = ua.match(/Firefox\/([0-9.]+)/i);
    browser = 'Mozilla Firefox';
    version = m ? m[1] : '';
  } else if (/Version\/([0-9.]+).*Safari/i.test(ua)) {
    const m = ua.match(/Version\/([0-9.]+)/i);
    browser = 'Apple Safari';
    version = m ? m[1] : '';
  }

  // Idioma e Cookies
  const language = navigator.language || (navigator.languages && navigator.languages[0]) || 'pt-BR';
  const cookiesEnabled = navigator.cookieEnabled ? 'Ativados' : 'Desativados';
  const hardwareConcurrency = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} núcleos virtuais` : 'Não divulgado';

  return {
    os,
    browser,
    version,
    architecture,
    fullBrowser: version ? `${browser} v${version}` : browser,
    language,
    cookiesEnabled,
    cpuCores: hardwareConcurrency,
    rawUserAgent: ua
  };
}

export function getGpuDiagnostics() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) {
      return {
        supported: false,
        vendor: 'Indisponível',
        renderer: 'Aceleração WebGL desativada ou não suportada',
        webglVersion: 'Nenhum',
        unmasked: false
      };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let vendor = 'Desconhecido';
    let renderer = 'Genérico';
    let unmasked = false;

    if (debugInfo) {
      vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
      unmasked = true;
    } else {
      vendor = gl.getParameter(gl.VENDOR) || vendor;
      renderer = gl.getParameter(gl.RENDERER) || renderer;
    }

    const version = gl.getParameter(gl.VERSION) || 'WebGL';
    const shadingVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'N/A';
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;

    return {
      supported: true,
      vendor: cleanGpuString(vendor),
      renderer: cleanGpuString(renderer),
      webglVersion: version,
      shadingVersion,
      maxTextureSize: `${maxTextureSize}px`,
      unmasked
    };
  } catch (e) {
    return {
      supported: false,
      vendor: 'Erro ao detectar',
      renderer: 'Erro na inicialização WebGL',
      webglVersion: 'N/A',
      unmasked: false
    };
  }
}

function cleanGpuString(str) {
  if (!str) return 'Desconhecido';
  return str.replace(/ANGLE \((.*)\)/i, '$1').trim();
}

export async function detectWebRtcLeak(timeoutMs = 2800) {
  return new Promise((resolve) => {
    const isSupported = typeof window.RTCPeerConnection !== 'undefined';
    if (!isSupported) {
      resolve({
        supported: false,
        hasLeak: false,
        leakedIps: [],
        status: 'WebRTC não suportado neste navegador',
        statusColor: 'slate'
      });
      return;
    }

    const leakedIps = new Set();
    const candidateTypes = new Set();
    let pc = null;
    let finished = false;

    const finish = (reason) => {
      if (finished) return;
      finished = true;
      if (pc) {
        try {
          pc.close();
        } catch (e) {}
      }

      const ips = Array.from(leakedIps);
      const hasPrivateLeak = ips.length > 0;

      resolve({
        supported: true,
        hasLeak: hasPrivateLeak,
        leakedIps: ips,
        candidateTypes: Array.from(candidateTypes),
        status: hasPrivateLeak
          ? `Alerta: IP Privado Revelado (${ips.join(', ')})`
          : 'Protegido (Sem vazamento de IP privado / mDNS ativo)',
        statusColor: hasPrivateLeak ? 'rose' : 'emerald',
        reason
      });
    };

    const timer = setTimeout(() => {
      finish('timeout');
    }, timeoutMs);

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.createDataChannel('diagnostic-channel');

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate) {
          return;
        }

        const cand = event.candidate.candidate;
        if (event.candidate.type) {
          candidateTypes.add(event.candidate.type);
        }

        // Regex para capturar endereços IPv4 dentro do candidato ICE
        const ipMatch = cand.match(/([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})/);
        if (ipMatch) {
          const ip = ipMatch[1];
          // Verifica se é faixa de rede privada (RFC 1918 e Link-Local)
          const isPrivate =
            /^10\./.test(ip) ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
            /^192\.168\./.test(ip) ||
            /^169\.254\./.test(ip);

          if (isPrivate) {
            leakedIps.add(ip);
          }
        }
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => finish('offer_error'));
    } catch (err) {
      clearTimeout(timer);
      finish('init_error');
    }
  });
}
