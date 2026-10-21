/**
 * Módulo de Verificação de Portas TCP Externas (Port Forwarding Checker)
 * Dispara uma sondagem TCP externa de fora da rede para testar se portas e regras de NAT/Firewall estão acessíveis.
 */

export const COMMON_PORTS = [
  { port: 80, name: 'HTTP', desc: 'Servidor Web' },
  { port: 443, name: 'HTTPS', desc: 'Web Seguro (SSL)' },
  { port: 8080, name: 'HTTP Alt', desc: 'Servidor Web Alternativo' },
  { port: 22, name: 'SSH', desc: 'Terminal Remoto Seguro' },
  { port: 3389, name: 'RDP', desc: 'Área de Trabalho Remota' },
  { port: 21, name: 'FTP', desc: 'Transferência de Arquivos' },
  { port: 25565, name: 'Minecraft', desc: 'Servidor Minecraft' },
  { port: 32400, name: 'Plex', desc: 'Servidor de Mídia Plex' },
  { port: 3306, name: 'MySQL', desc: 'Banco de Dados MySQL' },
  { port: 5432, name: 'Postgres', desc: 'Banco de Dados PostgreSQL' },
  { port: 8000, name: 'CFTV / DVR', desc: 'Câmeras de Segurança' }
];

/**
 * Valida o número de porta TCP (1-65535).
 * @param {number|string} port
 * @returns {{ valid: boolean, error?: string, portNumber?: number }}
 */
export function validatePort(port) {
  const num = Number(port);
  if (!port || isNaN(num) || !Number.isInteger(num)) {
    return { valid: false, error: 'A porta deve ser um número inteiro válido.' };
  }
  if (num < 1 || num > 65535) {
    return { valid: false, error: 'A porta deve estar no intervalo permitido de 1 a 65535.' };
  }
  return { valid: true, portNumber: num };
}

/**
 * Valida o IP ou Host alvo.
 * @param {string} host
 * @returns {{ valid: boolean, error?: string, hostClean?: string }}
 */
export function validateHost(host) {
  const clean = (host || '').trim();
  if (!clean) {
    return { valid: false, error: 'Informe um endereço IP ou nome de domínio válido.' };
  }
  // Remove protocolos se o usuário colou com http:// ou https://
  const sanitized = clean.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  if (!sanitized) {
    return { valid: false, error: 'Endereço de destino inválido.' };
  }
  return { valid: true, hostClean: sanitized };
}

/**
 * Testa se uma porta TCP está ABERTA (Open) ou FECHADA/FILTRADA (Closed/Timeout).
 * Utiliza sonda TCP externa para verificar de fora da LAN do usuário.
 * 
 * @param {string} host - IP público ou Domínio para teste
 * @param {number|string} port - Porta TCP desejada
 * @param {number} [timeoutMs=10000] - Tempo limite em milissegundos
 * @returns {Promise<{
 *   success: boolean,
 *   status: 'open' | 'closed' | 'timeout' | 'error',
 *   ip: string,
 *   port: number,
 *   delayMs: number | null,
 *   message: string
 * }>}
 */
export async function testTcpPort(host, port, timeoutMs = 10000) {
  const hostVal = validateHost(host);
  if (!hostVal.valid) {
    return {
      success: false,
      status: 'error',
      ip: host,
      port: Number(port) || 0,
      delayMs: null,
      message: hostVal.error
    };
  }

  const portVal = validatePort(port);
  if (!portVal.valid) {
    return {
      success: false,
      status: 'error',
      ip: hostVal.hostClean,
      port: Number(port) || 0,
      delayMs: null,
      message: portVal.error
    };
  }

  const targetHost = hostVal.hostClean;
  const targetPort = portVal.portNumber;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const endpoint = `https://testeportas.com.br/teste_porta.php?server=${encodeURIComponent(targetHost)}&port=${targetPort}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Falha na resposta do servidor de teste (HTTP ${response.status})`);
    }

    const data = await response.json();

    if (data.success === true) {
      return {
        success: true,
        status: 'open',
        ip: data.ip || targetHost,
        port: targetPort,
        delayMs: typeof data.connection_delay === 'number' ? data.connection_delay : null,
        message: `A porta ${targetPort} está ABERTA e acessível externamente!`
      };
    } else {
      return {
        success: false,
        status: 'closed',
        ip: data.ip || targetHost,
        port: targetPort,
        delayMs: null,
        message: `A porta ${targetPort} está FECHADA ou bloqueada por firewall/CGNAT.`
      };
    }
  } catch (err) {
    clearTimeout(timer);

    if (err.name === 'AbortError') {
      return {
        success: false,
        status: 'timeout',
        ip: targetHost,
        port: targetPort,
        delayMs: null,
        message: `Tempo limite esgotado (${timeoutMs / 1000}s). A porta parece estar FILTRADA ou descartada silenciosamente por firewall.`
      };
    }

    return {
      success: false,
      status: 'error',
      ip: targetHost,
      port: targetPort,
      delayMs: null,
      message: err.message || 'Falha ao consultar a sonda de verificação de portas.'
    };
  }
}
