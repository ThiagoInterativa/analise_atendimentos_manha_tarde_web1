import { CallRecord } from '../types';

const QUEUES = [
  'Suporte N1 - Técnico',
  'Suporte N2 - Especializado',
  'Financeiro / Cobrança',
  'Comercial / Vendas',
  'Cancelamento / Ouvidoria',
  'Plantão Redes',
];

const AGENTS = [
  'Lucas Pereira',
  'Beatriz Souza',
  'Rodrigo Santos',
  'Camila Rocha',
  'Felipe Lima',
  'Matheus Oliveira',
  'Fernanda Costa',
  'Gabriel Almeida',
  'Juliana Martins',
  'Thiago Ribeiro',
];

// Typical ISP / telecom hourly distribution weights
const HOURLY_WEIGHTS: Record<number, number> = {
  0: 1, 1: 1, 2: 0, 3: 1, 4: 1, 5: 2, 6: 4,
  7: 10,
  8: 24,
  9: 46,
  10: 58, // Morning peak
  11: 39,
  12: 21, // Lunch lull
  13: 28,
  14: 48, // Afternoon surge
  15: 44,
  16: 37,
  17: 42, // Post-work rush
  18: 32,
  19: 22,
  20: 14,
  21: 8,
  22: 4,
  23: 2,
};

/**
 * Generates realistic CDR dataset for dates between dataInicio and dataFim
 */
export function gerarDadosDemonstracao(dataInicio: string, dataFim: string): CallRecord[] {
  const dados: CallRecord[] = [];
  const start = new Date(dataInicio + 'T00:00:00');
  const end = new Date(dataFim + 'T23:59:59');

  // Loop through each day
  const current = new Date(start);
  let idCounter = 1;

  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = (current.getMonth() + 1).toString().padStart(2, '0');
    const dd = current.getDate().toString().padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const dateFormatted = `${dd}-${mm}-${yyyy}`;

    // Weekend factor (Saturdays 60%, Sundays 30% volume)
    const dayOfWeek = current.getDay();
    const dayFactor = dayOfWeek === 0 ? 0.35 : dayOfWeek === 6 ? 0.65 : 1.0;

    for (let h = 0; h < 24; h++) {
      const baseCount = Math.round((HOURLY_WEIGHTS[h] || 2) * dayFactor);
      // Small random variation +/- 20%
      const variation = 0.8 + Math.random() * 0.4;
      const totalCallsThisHour = Math.max(0, Math.round(baseCount * variation));

      for (let i = 0; i < totalCallsThisHour; i++) {
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const horaStr = `${h.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
        const dataHora = `${dateFormatted} ${horaStr}`;

        // Status probability: 88% Atendida, 9% Não Atendida, 3% Ocupado
        const randStatus = Math.random();
        let status = 'Atendida';
        let segundos = 0;

        if (randStatus < 0.88) {
          status = 'Atendida';
          // Normal distribution centered around 3.5 minutes (210s) with min 40s and max 800s
          const baseDuration = 180 + Math.random() * 180;
          const peakStress = (h === 10 || h === 14) ? 45 : 0; // Slightly longer during peak
          segundos = Math.max(35, Math.round(baseDuration + peakStress + (Math.random() * 60 - 30)));
        } else if (randStatus < 0.97) {
          status = 'Não Atendida';
          segundos = Math.round(15 + Math.random() * 45); // Ringing time before abandon
        } else {
          status = 'Ocupado';
          segundos = Math.round(5 + Math.random() * 15);
        }

        const durH = Math.floor(segundos / 3600);
        const durM = Math.floor((segundos % 3600) / 60);
        const durS = segundos % 60;
        const duracao = `${durH.toString().padStart(2, '0')}:${durM.toString().padStart(2, '0')}:${durS.toString().padStart(2, '0')}`;

        // Origin phone (DDD 11..19 or local)
        const ddd = 11 + Math.floor(Math.random() * 9);
        const numPart = Math.floor(10000000 + Math.random() * 89999999);
        const origem = `(${ddd}) 9${numPart.toString().slice(0, 4)}-${numPart.toString().slice(4)}`;

        // Queue & Agent assignment
        const queue = QUEUES[Math.floor(Math.random() * QUEUES.length)];
        const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];
        // Half the time PABX shows Agent, half the time queue name or both
        const fila = Math.random() > 0.4 ? agent : queue;

        dados.push({
          id: `call-${idCounter++}`,
          dataHora,
          data: isoDate,
          hora: horaStr,
          horaInt: h,
          minutoInt: minute,
          origem,
          destino: '0800 591 2000',
          fila,
          duracao,
          segundos,
          status,
          tipo: 'IN',
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  // Sort chronological
  return dados.sort((a, b) => a.dataHora.localeCompare(b.dataHora));
}
