export interface CallRecord {
  id?: string;
  dataHora: string;     // "17-10-2026 09:14:22"
  data: string;         // "2026-10-17"
  hora: string;         // "09:14:22"
  horaInt: number;      // 9
  minutoInt?: number;   // 14
  origem: string;
  destino: string;
  fila: string;         // Técnico ou Fila, ex: "Suporte N1", "Financeiro", "Carlos Silva"
  duracao: string;      // "00:04:32"
  segundos: number;     // 272
  status: string;       // "Atendida", "Não Atendida", "Ocupado", "Abandonada"
  tipo: string;         // "IN", "OUT", "Entrada", "Saída"
}

export interface HourlyStats {
  hora: number;                  // 0..23
  faixaHoraria: string;          // "08:00 - 08:59"
  faixaSimples: string;          // "08h"
  totalChamadas: number;
  atendidas: number;
  naoAtendidas: number;
  taxaAtendimento: number;       // Percentual (ex: 88.5)
  tempoTotalSegundos: number;
  tempoTotalFormatado: string;   // "04h 15m"
  tmaSegundos: number;
  tmaFormatado: string;          // "03:45"
  percentualVolume: number;      // % em relação ao dia
  nivelCarga: 'baixo' | 'moderado' | 'alto' | 'pico';
  atendentesRecomendados: number; // Dimensionamento sugerido para essa hora
  filasPrincipais: Array<{ fila: string; qtd: number }>;
}

export interface GeneralKpis {
  totalGeral: number;
  totalAtendidas: number;
  totalNaoAtendidas: number;
  taxaAtendimentoGeral: number;
  totalManha: number;          // 08:15 às 13:00
  totalTarde: number;          // 13:00 às 21:00
  tempoTotalSegundos: number;
  tempoTotalFormatado: string;
  tmaSegundos: number;
  tmaFormatado: string;
  horaPico: {
    faixa: string;
    total: number;
    tma: string;
  };
  horaMaisTranquila: {
    faixa: string;
    total: number;
  };
  alertas: string[];
}

export interface TechnicianRank {
  tecnico: string;
  chamadas: number;
  segundos: number;
  tempoFormatado: string;
  tmaSegundos: number;
  tmaFormatado: string;
  percentualTotal: number;
}

export interface ShiftPlanRecommendation {
  metaOcupacao: number; // ex: 80%
  horarioPicoMaximo: string;
  recomendacoesPausaAlmoco: string[];
  alertasGargalo: string[];
  turnosSugeridos: {
    manha: {
      horario: string;
      atendentes: number;
      volumeMedioHora: number;
      observacao: string;
    };
    intermediario: {
      horario: string;
      atendentes: number;
      volumeMedioHora: number;
      observacao: string;
    };
    tarde: {
      horario: string;
      atendentes: number;
      volumeMedioHora: number;
      observacao: string;
    };
  };
}

export interface FilterOptions {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  horaInicio: number; // 0..23
  horaFim: number;    // 0..23
  status: string;     // 'todos' | 'atendida' | 'nao_atendida'
  fila: string;       // 'todos' ou nome específico
  tipoChamada: string;// 'IN' | 'OUT' | 'todos'
}

export interface PabxCredentials {
  loginUrl: string;
  cdrUrl: string;
  email: string;
  senha: string;
}
