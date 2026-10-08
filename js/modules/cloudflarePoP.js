// Dicionário com os principais Pontos de Presença (PoP / Colo) da Cloudflare no mundo
export const CLOUDFLARE_POPS = {
  // Brasil & América Latina
  'GRU': { name: 'São Paulo (Guarulhos)', country: 'Brasil', flag: '🇧🇷' },
  'CGH': { name: 'São Paulo (Congonhas)', country: 'Brasil', flag: '🇧🇷' },
  'GIG': { name: 'Rio de Janeiro (Galeão)', country: 'Brasil', flag: '🇧🇷' },
  'BSB': { name: 'Brasília', country: 'Brasil', flag: '🇧🇷' },
  'POA': { name: 'Porto Alegre', country: 'Brasil', flag: '🇧🇷' },
  'CWB': { name: 'Curitiba', country: 'Brasil', flag: '🇧🇷' },
  'SSA': { name: 'Salvador', country: 'Brasil', flag: '🇧🇷' },
  'FOR': { name: 'Fortaleza', country: 'Brasil', flag: '🇧🇷' },
  'REC': { name: 'Recife', country: 'Brasil', flag: '🇧🇷' },
  'CNF': { name: 'Belo Horizonte (Confins)', country: 'Brasil', flag: '🇧🇷' },
  'VIX': { name: 'Vitória', country: 'Brasil', flag: '🇧🇷' },
  'GYN': { name: 'Goiânia', country: 'Brasil', flag: '🇧🇷' },
  'BEL': { name: 'Belém', country: 'Brasil', flag: '🇧🇷' },
  'MAO': { name: 'Manaus', country: 'Brasil', flag: '🇧🇷' },
  'FLN': { name: 'Florianópolis', country: 'Brasil', flag: '🇧🇷' },
  'CGB': { name: 'Cuiabá', country: 'Brasil', flag: '🇧🇷' },
  'EZE': { name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  'SCL': { name: 'Santiago', country: 'Chile', flag: '🇨🇱' },
  'BOG': { name: 'Bogotá', country: 'Colômbia', flag: '🇨🇴' },
  'LIM': { name: 'Lima', country: 'Peru', flag: '🇵🇪' },
  'MVD': { name: 'Montevidéu', country: 'Uruguai', flag: '🇺🇾' },
  'MEX': { name: 'Cidade do México', country: 'México', flag: '🇲🇽' },
  'QRO': { name: 'Querétaro', country: 'México', flag: '🇲🇽' },

  // América do Norte
  'MIA': { name: 'Miami (FL)', country: 'Estados Unidos', flag: '🇺🇸' },
  'ATL': { name: 'Atlanta (GA)', country: 'Estados Unidos', flag: '🇺🇸' },
  'IAD': { name: 'Washington D.C. (Dulles)', country: 'Estados Unidos', flag: '🇺🇸' },
  'EWR': { name: 'Newark / Nova York (NJ)', country: 'Estados Unidos', flag: '🇺🇸' },
  'JFK': { name: 'Nova York (NY)', country: 'Estados Unidos', flag: '🇺🇸' },
  'ORD': { name: 'Chicago (IL)', country: 'Estados Unidos', flag: '🇺🇸' },
  'DFW': { name: 'Dallas (TX)', country: 'Estados Unidos', flag: '🇺🇸' },
  'LAX': { name: 'Los Angeles (CA)', country: 'Estados Unidos', flag: '🇺🇸' },
  'SFO': { name: 'São Francisco (CA)', country: 'Estados Unidos', flag: '🇺🇸' },
  'SJC': { name: 'San Jose (CA)', country: 'Estados Unidos', flag: '🇺🇸' },
  'SEA': { name: 'Seattle (WA)', country: 'Estados Unidos', flag: '🇺🇸' },
  'DEN': { name: 'Denver (CO)', country: 'Estados Unidos', flag: '🇺🇸' },
  'YYZ': { name: 'Toronto', country: 'Canadá', flag: '🇨🇦' },
  'YVR': { name: 'Vancouver', country: 'Canadá', flag: '🇨🇦' },
  'YUL': { name: 'Montreal', country: 'Canadá', flag: '🇨🇦' },

  // Europa
  'LHR': { name: 'Londres (Heathrow)', country: 'Reino Unido', flag: '🇬🇧' },
  'LGW': { name: 'Londres (Gatwick)', country: 'Reino Unido', flag: '🇬🇧' },
  'AMS': { name: 'Amsterdã', country: 'Países Baixos', flag: '🇳🇱' },
  'FRA': { name: 'Frankfurt', country: 'Alemanha', flag: '🇩🇪' },
  'CDG': { name: 'Paris (Charles de Gaulle)', country: 'França', flag: '🇫🇷' },
  'MAD': { name: 'Madri', country: 'Espanha', flag: '🇪🇸' },
  'LIS': { name: 'Lisboa', country: 'Portugal', flag: '🇵🇹' },
  'OPO': { name: 'Porto', country: 'Portugal', flag: '🇵🇹' },
  'MXP': { name: 'Milão', country: 'Itália', flag: '🇮🇹' },
  'FCO': { name: 'Roma', country: 'Itália', flag: '🇮🇹' },
  'ZRH': { name: 'Zurique', country: 'Suíça', flag: '🇨🇭' },
  'VIE': { name: 'Viena', country: 'Áustria', flag: '🇦🇹' },
  'DUB': { name: 'Dublin', country: 'Irlanda', flag: '🇮🇪' },
  'ARN': { name: 'Estocolmo', country: 'Suécia', flag: '🇸🇪' },
  'OSL': { name: 'Oslo', country: 'Noruega', flag: '🇳🇴' },
  'CPH': { name: 'Copenhague', country: 'Dinamarca', flag: '🇩🇰' },
  'WAW': { name: 'Varsóvia', country: 'Polônia', flag: '🇵🇱' },

  // Ásia & Pacífico
  'NRT': { name: 'Tóquio (Narita)', country: 'Japão', flag: '🇯🇵' },
  'HND': { name: 'Tóquio (Haneda)', country: 'Japão', flag: '🇯🇵' },
  'KIX': { name: 'Osaka', country: 'Japão', flag: '🇯🇵' },
  'HKG': { name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  'SIN': { name: 'Singapura', country: 'Singapura', flag: '🇸🇬' },
  'ICN': { name: 'Seul', country: 'Coreia do Sul', flag: '🇰🇷' },
  'TPE': { name: 'Taipei', country: 'Taiwan', flag: '🇹🇼' },
  'SYD': { name: 'Sydney', country: 'Austrália', flag: '🇦🇺' },
  'MEL': { name: 'Melbourne', country: 'Austrália', flag: '🇦🇺' },
  'BOM': { name: 'Mumbai', country: 'Índia', flag: '🇮🇳' },
  'DEL': { name: 'Nova Délhi', country: 'Índia', flag: '🇮🇳' }
};

export function resolveCloudflareColo(coloCode) {
  if (!coloCode) return null;
  const upper = coloCode.toUpperCase().trim();
  const info = CLOUDFLARE_POPS[upper];
  if (info) {
    return {
      code: upper,
      name: info.name,
      country: info.country,
      flag: info.flag,
      formatted: `${upper} — ${info.name} ${info.flag}`
    };
  }
  return {
    code: upper,
    name: `Datacenter (${upper})`,
    country: 'Desconhecido',
    flag: '🌐',
    formatted: `${upper} — Datacenter Borda Cloudflare`
  };
}
