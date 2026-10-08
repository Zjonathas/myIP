/**
 * Network Diagnostics & IP Inspector — Controlador Principal (v2.1 Refactored)
 */

import { detectIPs } from './modules/ipDetector.js';
import { fetchGeoLocation } from './modules/geoLocator.js';
import { fetchEdgeTelemetry } from './modules/edgeTelemetry.js';
import { measurePing, getNetworkInformation } from './modules/latencyMetrics.js';
import {
  getDisplayDiagnostics,
  parseUserAgent,
  getGpuDiagnostics,
  detectWebRtcLeak
} from './modules/deviceDiagnostics.js';
import {
  generatePlainTextReport,
  generateMarkdownReport,
  generateJsonReport,
  copyToClipboard,
  downloadFile
} from './modules/exportManager.js';

// Estado global da aplicação
const state = {
  ip: null,
  geo: null,
  edge: null,
  latency: null,
  netInfo: null,
  display: null,
  ua: null,
  gpu: null,
  webrtc: null,
  isRunning: false,
  mapInstance: null,
  mapMarker: null,
  activeExportTab: 'text',
  soundEnabled: false
};

// ============================================================================
// INICIALIZAÇÃO
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initIcons();
  initClock();
  initEventListeners();
  initMap();
  runAllDiagnostics();
});

function initIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Relógio em tempo real com compensação de fuso
function initClock() {
  const clockLocal = document.getElementById('clock-local');
  const clockUtc = document.getElementById('clock-utc');

  const update = () => {
    const now = new Date();
    if (clockLocal) {
      clockLocal.textContent = now.toLocaleTimeString('pt-BR') + ' ' + getTimezoneOffsetString(now);
    }
    if (clockUtc) {
      clockUtc.textContent = now.toISOString().slice(11, 19) + ' UTC';
    }
  };

  update();
  setInterval(update, 1000);
}

function getTimezoneOffsetString(date) {
  const offset = -date.getTimezoneOffset();
  const diff = offset >= 0 ? '+' : '-';
  const pad = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0');
  return `${diff}${pad(offset / 60)}:${pad(offset % 60)}`;
}

// Sintetizador Web Audio API para feedback tátil sonoro NOC (desativado por padrão)
function playBeep(freq = 720, duration = 0.05) {
  if (!state.soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignora restrições de autoplay
  }
}

// ============================================================================
// GERENCIADOR DE MAPA LEAFLET
// ============================================================================
function initMap() {
  const mapContainer = document.getElementById('map-container');
  if (!mapContainer || typeof L === 'undefined') return;

  try {
    state.mapInstance = L.map('map-container', {
      zoomControl: false,
      attributionControl: false
    }).setView([0, 0], 2);

    // Camada de Tiles Esri World Dark Gray (Sem marca d'água / Alta fidelidade NOC)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
      attribution: 'Tiles &copy; Esri'
    }).addTo(state.mapInstance);

    L.control.zoom({ position: 'bottomright' }).addTo(state.mapInstance);
  } catch (err) {
    console.warn('Falha ao inicializar o mapa Leaflet:', err);
  }
}

function updateMapLocation(lat, lon, label = 'Localização do IP') {
  if (!state.mapInstance || !lat || !lon) return;

  try {
    state.mapInstance.setView([lat, lon], 10, { animate: true });

    if (state.mapMarker) {
      state.mapMarker.remove();
    }

    state.mapMarker = L.circleMarker([lat, lon], {
      radius: 9,
      fillColor: '#06b6d4',
      color: '#38bdf8',
      weight: 2.5,
      opacity: 1,
      fillOpacity: 0.85
    }).addTo(state.mapInstance);

    state.mapMarker.bindPopup(`<b style="color: #0f172a;">${label}</b><br><small style="color: #334155;">Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}</small>`);
  } catch (err) {
    console.warn('Erro ao atualizar marcador no mapa:', err);
  }
}

// ============================================================================
// EXECUTOR CENTRAL DE DIAGNÓSTICOS
// ============================================================================
async function runAllDiagnostics() {
  if (state.isRunning) return;
  state.isRunning = true;
  playBeep(540, 0.08);

  setReloadState(true);

  // 1. Diagnósticos imediatos locais do cliente
  state.display = getDisplayDiagnostics();
  state.ua = parseUserAgent();
  state.gpu = getGpuDiagnostics();
  state.netInfo = getNetworkInformation();

  renderClientDiagnostics();

  // 2. Diagnósticos remotos de rede assíncronos
  try {
    const webrtcPromise = detectWebRtcLeak().then((res) => {
      state.webrtc = res;
      renderWebRtcDiagnostics();
    });

    const pingPromise = runPingTest();

    const [ipResult, edgeResult] = await Promise.all([
      detectIPs(),
      fetchEdgeTelemetry()
    ]);

    state.ip = ipResult;
    state.edge = edgeResult;

    renderIpDiagnostics();
    renderEdgeTelemetry();

    // Consulta de geolocalização com fallback
    const targetIp = state.ip?.primaryIp && state.ip.primaryIp !== 'Desconhecido' ? state.ip.primaryIp : '';
    state.geo = await fetchGeoLocation(targetIp);
    renderGeoDiagnostics();

    await Promise.allSettled([webrtcPromise, pingPromise]);

    playBeep(880, 0.06);
    showToast('Diagnóstico atualizado com sucesso!', 'success');
  } catch (error) {
    console.error('Erro na execução dos diagnósticos:', error);
    showToast('Ocorreu uma falha durante as consultas.', 'warning');
  } finally {
    state.isRunning = false;
    setReloadState(false);
    initIcons();
  }
}

async function runPingTest() {
  const ticker = document.getElementById('ping-ticker');
  const samplesContainer = document.getElementById('ping-samples-container');

  if (ticker) ticker.textContent = 'Enviando pacotes...';

  state.latency = await measurePing(4, (curr, duration, total) => {
    if (ticker) ticker.textContent = `Amostra ${curr}/${total}: ${duration}ms`;
    if (samplesContainer) {
      const bar = samplesContainer.children[curr - 1];
      if (bar) {
        bar.textContent = `${duration}ms`;
        const color = duration < 35 ? 'text-emerald-300 bg-emerald-950 border-emerald-800' :
                      duration < 80 ? 'text-cyan-200 bg-cyan-950 border-cyan-800' :
                      'text-amber-200 bg-amber-950 border-amber-800';
        bar.className = `rounded flex items-center justify-center text-[10px] font-bold border transition-all ${color}`;
      }
    }
  });

  renderLatencyDiagnostics();
}

// ============================================================================
// RENDERIZADORES DE UI
// ============================================================================

function renderClientDiagnostics() {
  const d = state.display || {};
  const ua = state.ua || {};
  const gpu = state.gpu || {};
  const net = state.netInfo || {};

  // Display
  setText('disp-screen', d.screenResolution);
  setText('disp-viewport', d.viewportResolution);
  setText('disp-dpr', d.devicePixelRatio);
  setText('disp-color', d.colorDepth);

  // GPU
  const gpuRendererEl = document.getElementById('gpu-renderer');
  if (gpuRendererEl) {
    gpuRendererEl.textContent = gpu.renderer || 'N/A';
    gpuRendererEl.title = gpu.renderer || '';
  }
  setText('gpu-vendor', gpu.vendor);
  setText('gpu-webgl-ver', gpu.webglVersion);

  // User Agent
  setText('ua-os', ua.os);
  setText('ua-arch', ua.architecture);
  setText('ua-browser', ua.fullBrowser || ua.browser);
  setText('ua-cores', ua.cpuCores);
  setText('raw-user-agent', ua.rawUserAgent);

  // Network Information API
  if (net.supported) {
    setText('net-effective-type', net.effectiveType);
    setText('net-downlink', net.downlink);
    setText('net-rtt', net.rtt);
    setText('hero-network-type', `Rede: ${net.effectiveType} (${net.downlink})`);
  } else {
    setText('net-effective-type', 'N/A');
    setText('net-downlink', 'N/A');
    setText('net-rtt', 'N/A');
    setText('hero-network-type', 'Conexão Banda Larga / IP');
    const note = document.getElementById('net-unsupported-note');
    if (note) note.classList.remove('hidden');
  }
}

function renderIpDiagnostics() {
  const ip = state.ip || {};
  const ipv4 = ip.ipv4 || {};
  const ipv6 = ip.ipv6 || {};

  // Hero Display
  const heroIpDisplay = document.getElementById('hero-ip-display');
  if (heroIpDisplay) {
    heroIpDisplay.textContent = ip.primaryIp || 'Indisponível';
  }

  // IPv4 Card
  const valIpv4 = document.getElementById('val-ipv4');
  const srcIpv4 = document.getElementById('src-ipv4');
  if (valIpv4) {
    valIpv4.textContent = ipv4.ip || 'Não detectado';
    if (!ipv4.ip) valIpv4.classList.add('text-slate-500');
  }
  if (srcIpv4) {
    srcIpv4.textContent = ipv4.source ? `Origem: ${ipv4.source}` : (ipv4.error || 'Indisponível');
  }

  // IPv6 Card
  const valIpv6 = document.getElementById('val-ipv6');
  const srcIpv6 = document.getElementById('src-ipv6');
  const dotIpv6 = document.getElementById('dot-ipv6');
  const btnCopyIpv6 = document.getElementById('btn-copy-ipv6');

  if (valIpv6) {
    if (ipv6.supported && ipv6.ip) {
      valIpv6.textContent = ipv6.ip;
      valIpv6.classList.remove('text-slate-500');
      valIpv6.classList.add('text-emerald-300');
      if (dotIpv6) dotIpv6.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400';
      if (btnCopyIpv6) btnCopyIpv6.disabled = false;
    } else {
      valIpv6.textContent = 'Não detectado / Sem suporte IPv6 nativo';
      valIpv6.classList.add('text-slate-500');
      if (dotIpv6) dotIpv6.className = 'w-1.5 h-1.5 rounded-full bg-slate-600';
      if (btnCopyIpv6) btnCopyIpv6.disabled = true;
    }
  }
  if (srcIpv6) {
    srcIpv6.textContent = ipv6.supported ? `Origem: ${ipv6.source}` : 'Roteamento operando via pilha IPv4 simples';
  }
}

function renderGeoDiagnostics() {
  const geo = state.geo || {};
  const heroIsp = document.getElementById('hero-isp-summary');
  const fallbackAlert = document.getElementById('fallback-alert');
  const fallbackMsg = document.getElementById('fallback-alert-msg');

  // Fallback Alert
  if (geo.isFallback) {
    if (fallbackAlert) fallbackAlert.classList.remove('hidden');
    if (fallbackMsg) {
      fallbackMsg.textContent = geo.fallbackReason
        ? `Fallback ativado: ${geo.fallbackReason}. Fonte ativa atual: ${geo.source}`
        : `Aviso: O provedor primário atingiu limite de requisições. Exibindo dados de ${geo.source}.`;
    }
  } else {
    if (fallbackAlert) fallbackAlert.classList.add('hidden');
  }

  // Hero ISP
  if (heroIsp) {
    const parts = [
      geo.isp,
      geo.city ? `• ${geo.city}` : '',
      geo.country ? `(${geo.country})` : ''
    ].filter(Boolean);
    heroIsp.textContent = parts.join(' ') || 'Provedor desconhecido';
  }

  // ASN / ISP
  setText('val-isp', geo.isp || 'N/A');
  const ispEl = document.getElementById('val-isp');
  if (ispEl && geo.isp) ispEl.title = geo.isp;

  setText('val-asn', geo.asn || 'N/A');
  setText('val-org', geo.org || geo.isp || 'N/A');
  setText('geo-source-badge', geo.source || 'Geo Provider');

  // Localização
  setText('val-city', geo.city || 'N/A');
  setText('val-region', geo.region || 'N/A');
  setText('val-country', geo.country ? `${geo.country} (${geo.countryCode || ''})` : 'N/A');
  setText('val-timezone', geo.timezone || 'N/A');

  // Bandeira
  const flagEl = document.getElementById('val-country-flag');
  if (flagEl) {
    if (geo.flagUrl) {
      flagEl.src = geo.flagUrl;
      flagEl.classList.remove('hidden');
    } else {
      flagEl.classList.add('hidden');
    }
  }

  // Coordenadas e Mapa
  if (geo.latitude && geo.longitude) {
    setText('val-coordinates', `Lat: ${geo.latitude.toFixed(4)} | Lon: ${geo.longitude.toFixed(4)}`);
    updateMapLocation(geo.latitude, geo.longitude, `${geo.city || 'IP'}, ${geo.country || ''}`);

    const mapLink = document.getElementById('link-external-maps');
    if (mapLink) {
      mapLink.href = `https://www.openstreetmap.org/?mlat=${geo.latitude}&mlon=${geo.longitude}#map=12/${geo.latitude}/${geo.longitude}`;
    }
  } else {
    setText('val-coordinates', 'Coordenadas não disponíveis');
  }
}

function renderEdgeTelemetry() {
  const edge = state.edge || {};

  setText('hero-protocol-val', edge.httpProtocol || '--');
  setText('hero-tls-val', edge.tlsVersion || '--');
  setText('hero-pop-code', edge.coloCode || '--');
  setText('hero-pop-name', edge.coloDetails?.name || 'Datacenter Cloudflare');

  setText('val-http-protocol', edge.httpProtocol || 'N/A');
  setText('val-tls-version', edge.tlsVersion || 'N/A');
  setText('val-colo-code', edge.coloCode || 'N/A');
  setText('val-colo-formatted', edge.coloDetails?.formatted || (edge.coloCode ? `PoP ${edge.coloCode}` : 'N/A'));
  setText('val-sni', edge.sni || 'N/A');
  setText('val-kex', edge.kex || 'N/A');
  setText('edge-endpoint-badge', edge.endpoint || '/cdn-cgi/trace');
}

function renderLatencyDiagnostics() {
  const lat = state.latency || {};

  setText('hero-latency-val', lat.avg !== null ? lat.avg : '--');
  setText('hero-latency-rating', lat.rating || 'Indisponível');

  setText('ping-val-avg', lat.avg !== null ? `${lat.avg} ms` : '--');
  setText('ping-val-min', lat.min !== null ? lat.min : '--');
  setText('ping-val-max', lat.max !== null ? lat.max : '--');
  setText('ping-val-jitter', lat.jitter !== null ? lat.jitter : '--');
  setText('ping-rating-badge', lat.rating || 'Calculado');
  setText('ping-ticker', lat.avg !== null ? `Média concluída: ${lat.avg}ms` : 'Erro de conexão');

  const ratingEl = document.getElementById('ping-rating-badge');
  if (ratingEl && lat.ratingColor) {
    ratingEl.className = `text-[10px] font-bold text-${lat.ratingColor}-400`;
  }
}

function renderWebRtcDiagnostics() {
  const w = state.webrtc || {};
  const badge = document.getElementById('webrtc-badge');
  const text = document.getElementById('webrtc-status-text');
  const leakBox = document.getElementById('webrtc-leaked-box');
  const leakList = document.getElementById('webrtc-leaked-list');

  if (badge) {
    if (w.hasLeak) {
      badge.textContent = 'Vazamento!';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800';
    } else {
      badge.textContent = 'Protegido';
      badge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800';
    }
  }

  if (text) {
    text.textContent = w.status || 'Teste concluído.';
  }

  if (w.hasLeak && leakBox && leakList) {
    leakBox.classList.remove('hidden');
    leakList.textContent = w.leakedIps.join(', ');
  } else if (leakBox) {
    leakBox.classList.add('hidden');
  }
}

function setText(elementId, text) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text !== null && text !== undefined && text !== '' ? text : '--';
  }
}

function setReloadState(isLoading) {
  const icon = document.getElementById('reload-icon');
  const btn = document.getElementById('btn-reload');
  if (icon) {
    if (isLoading) {
      icon.classList.add('animate-spin');
    } else {
      icon.classList.remove('animate-spin');
    }
  }
  if (btn) {
    btn.disabled = isLoading;
  }
}

// ============================================================================
// EVENT LISTENERS & MODAL INTERACTION
// ============================================================================
function initEventListeners() {
  // Sound Toggle
  const btnSound = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  if (btnSound && soundIcon) {
    btnSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      if (state.soundEnabled) {
        btnSound.className = 'p-2 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-300 transition-colors';
        soundIcon.setAttribute('data-lucide', 'volume-2');
        playBeep(800, 0.08);
        showToast('Efeitos sonoros NOC ativados', 'info');
      } else {
        btnSound.className = 'p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors';
        soundIcon.setAttribute('data-lucide', 'volume-x');
        showToast('Efeitos sonoros desativados', 'info');
      }
      initIcons();
    });
  }

  // Botão Recarregar Diagnósticos
  const btnReload = document.getElementById('btn-reload');
  if (btnReload) {
    btnReload.addEventListener('click', () => {
      runAllDiagnostics();
    });
  }

  // Botão Repetir Teste de Ping
  const btnRetestPing = document.getElementById('btn-retest-ping');
  if (btnRetestPing) {
    btnRetestPing.addEventListener('click', () => {
      runPingTest();
    });
  }

  // Copiar Coordenadas no Mapa
  const btnCopyCoords = document.getElementById('btn-copy-coords');
  if (btnCopyCoords) {
    btnCopyCoords.addEventListener('click', async () => {
      if (state.geo?.latitude && state.geo?.longitude) {
        const text = `${state.geo.latitude}, ${state.geo.longitude}`;
        const ok = await copyToClipboard(text);
        if (ok) showToast(`Coordenadas copiadas: ${text}`, 'success');
      }
    });
  }

  // Quick Copy Buttons
  setupCopyButton('btn-quick-copy', () => state.ip?.primaryIp);
  setupCopyButton('btn-hero-copy', () => state.ip?.primaryIp);
  setupCopyButton('btn-copy-ipv4', () => state.ip?.ipv4?.ip);
  setupCopyButton('btn-copy-ipv6', () => state.ip?.ipv6?.ip);
  setupCopyButton('btn-copy-ua', () => state.ua?.rawUserAgent);

  // Modal de Exportação
  const btnExportModal = document.getElementById('btn-export-modal');
  const modalExport = document.getElementById('modal-export');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const tabBtnText = document.getElementById('tab-btn-text');
  const tabBtnMarkdown = document.getElementById('tab-btn-markdown');
  const tabBtnJson = document.getElementById('tab-btn-json');
  const previewArea = document.getElementById('export-preview-area');
  const btnModalCopy = document.getElementById('btn-modal-copy');
  const btnModalDownload = document.getElementById('btn-modal-download');

  const updatePreview = () => {
    if (!previewArea) return;
    if (state.activeExportTab === 'text') {
      previewArea.value = generatePlainTextReport(state);
    } else if (state.activeExportTab === 'markdown') {
      previewArea.value = generateMarkdownReport(state);
    } else {
      previewArea.value = generateJsonReport(state);
    }
  };

  if (btnExportModal && modalExport) {
    btnExportModal.addEventListener('click', () => {
      modalExport.classList.remove('hidden');
      updatePreview();
      initIcons();
    });
  }

  // Toggle User-Agent Accordion
  const btnToggleUa = document.getElementById('btn-toggle-ua');
  const uaContent = document.getElementById('ua-accordion-content');
  const uaChevron = document.getElementById('ua-chevron');
  if (btnToggleUa && uaContent) {
    btnToggleUa.addEventListener('click', () => {
      const isHidden = uaContent.classList.toggle('hidden');
      if (uaChevron) {
        uaChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      }
    });
  }

  // Modal Backdrop Click
  const modalBackdrop = document.getElementById('modal-backdrop');
  if (modalBackdrop && modalExport) {
    modalBackdrop.addEventListener('click', () => {
      modalExport.classList.add('hidden');
    });
  }

  if (btnCloseModal && modalExport) {
    btnCloseModal.addEventListener('click', () => {
      modalExport.classList.add('hidden');
    });
  }

  if (modalExport) {
    modalExport.addEventListener('click', (e) => {
      if (e.target === modalExport) {
        modalExport.classList.add('hidden');
      }
    });
  }

  // Tabs do modal (Texto Puro, Markdown, JSON)
  const setTab = (activeId) => {
    state.activeExportTab = activeId;
    const tabs = [
      { id: 'text', btn: tabBtnText, label: 'Copiar Texto' },
      { id: 'markdown', btn: tabBtnMarkdown, label: 'Copiar Markdown' },
      { id: 'json', btn: tabBtnJson, label: 'Copiar JSON' }
    ];

    tabs.forEach((t) => {
      if (!t.btn) return;
      if (t.id === activeId) {
        t.btn.className = 'px-3.5 py-2 border-b-2 border-cyan-400 text-cyan-300 font-bold transition-colors';
        const label = document.getElementById('btn-modal-copy-label');
        if (label) label.textContent = t.label;
      } else {
        t.btn.className = 'px-3.5 py-2 border-b-2 border-transparent text-slate-400 hover:text-slate-200 transition-colors';
      }
    });

    updatePreview();
  };

  if (tabBtnText) tabBtnText.addEventListener('click', () => setTab('text'));
  if (tabBtnMarkdown) tabBtnMarkdown.addEventListener('click', () => setTab('markdown'));
  if (tabBtnJson) tabBtnJson.addEventListener('click', () => setTab('json'));

  // Ações do Modal
  if (btnModalCopy) {
    btnModalCopy.addEventListener('click', async () => {
      const content = previewArea ? previewArea.value : '';
      if (!content) return;
      playBeep(750, 0.05);
      const ok = await copyToClipboard(content);
      if (ok) {
        showToast(`Relatório (${state.activeExportTab.toUpperCase()}) copiado!`, 'success');
      } else {
        showToast('Falha ao copiar relatório.', 'error');
      }
    });
  }

  if (btnModalDownload) {
    btnModalDownload.addEventListener('click', () => {
      const content = previewArea ? previewArea.value : '';
      if (!content) return;
      playBeep(650, 0.05);
      const ext = state.activeExportTab === 'json' ? 'json' : state.activeExportTab === 'markdown' ? 'md' : 'txt';
      const mime = state.activeExportTab === 'json' ? 'application/json' : 'text/plain;charset=utf-8';
      const filename = `network-diagnostics-${new Date().toISOString().slice(0, 10)}.${ext}`;
      downloadFile(filename, content, mime);
      showToast(`Arquivo ${filename} baixado!`, 'success');
    });
  }

  // Atalhos de teclado
  document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key === 'r' || e.key === 'R') {
      e.preventDefault();
      runAllDiagnostics();
    } else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      if (state.ip?.primaryIp) {
        copyToClipboard(state.ip.primaryIp).then((ok) => {
          if (ok) {
            playBeep(700, 0.04);
            showToast(`IP Copiado: ${state.ip.primaryIp}`, 'success');
          }
        });
      }
    } else if (e.key === 'e' || e.key === 'E') {
      e.preventDefault();
      if (modalExport) {
        modalExport.classList.toggle('hidden');
        if (!modalExport.classList.contains('hidden')) {
          updatePreview();
          initIcons();
        }
      }
    } else if (e.key === 'Escape') {
      if (modalExport && !modalExport.classList.contains('hidden')) {
        modalExport.classList.add('hidden');
      }
    }
  });
}

function setupCopyButton(buttonId, getValueFn) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const val = getValueFn();
    if (!val || val === 'Desconhecido' || val === 'Não detectado' || val === 'Indisponível') {
      showToast('Nenhum dado disponível para copiar.', 'warning');
      return;
    }

    playBeep(700, 0.04);
    const success = await copyToClipboard(val);
    if (success) {
      showToast(`Copiado: ${val}`, 'success');

      const originalHtml = btn.innerHTML;
      const hasText = !!btn.querySelector('span');
      if (hasText) {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i><span class="text-emerald-400">Copiado!</span>`;
      } else {
        btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-400"></i>`;
      }
      initIcons();

      setTimeout(() => {
        btn.innerHTML = originalHtml;
        initIcons();
      }, 1800);
    } else {
      showToast('Não foi possível acessar a área de transferência.', 'error');
    }
  });
}

// ============================================================================
// SISTEMA DE TOAST NOTIFICATIONS (MINIMALISTA)
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const typeStyles = {
    success: 'bg-[#11141c] border-emerald-500/40 text-emerald-300',
    warning: 'bg-[#11141c] border-amber-500/40 text-amber-300',
    error: 'bg-[#11141c] border-rose-500/40 text-rose-300',
    info: 'bg-[#11141c] border-[#2e374d] text-slate-200'
  };

  const icons = {
    success: 'check-circle',
    warning: 'alert-triangle',
    error: 'x-circle',
    info: 'info'
  };

  toast.className = `pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-xs shadow-xl backdrop-blur-md toast-enter ${typeStyles[type] || typeStyles.info}`;
  toast.innerHTML = `
    <i data-lucide="${icons[type] || 'info'}" class="w-4 h-4 shrink-0"></i>
    <span class="font-sans font-medium">${message}</span>
  `;

  container.appendChild(toast);
  initIcons();

  setTimeout(() => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      toast.remove();
    }, 280);
  }, 3000);
}
