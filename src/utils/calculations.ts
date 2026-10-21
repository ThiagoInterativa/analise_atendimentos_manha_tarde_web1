import { CallRecord, HourlyStats, GeneralKpis, TechnicianRank, ShiftPlanRecommendation } from '../types';

export function formatSecondsToMinutesSeconds(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const totalSec = Math.round(seconds);
  const minutes = Math.floor(totalSec / 60);
  const remainingSeconds = totalSec % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function formatSecondsToHoursMinutes(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function formatSecondsToFullTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Filter records by date, time range, status, queue and direction
 */
export function filtrarChamadas(
  dados: CallRecord[],
  filtros: {
    dataInicio?: string;
    dataFim?: string;
    horaInicio?: number;
    horaFim?: number;
    status?: string;
    fila?: string;
    tipoChamada?: string;
  }
): CallRecord[] {
  const {
    dataInicio,
    dataFim,
    horaInicio = 0,
    horaFim = 23,
    status = 'todos',
    fila = 'todos',
    tipoChamada = 'IN',
  } = filtros;

  return dados.filter((d) => {
    // Date filter
    if (dataInicio && d.data < dataInicio) return false;
    if (dataFim && d.data > dataFim) return false;

    // Time filter
    if (d.horaInt < horaInicio || d.horaInt > horaFim) return false;

    // Status filter
    if (status !== 'todos') {
      const isAtendida = d.status.toLowerCase().includes('atendida') && !d.status.toLowerCase().includes('não');
      if (status === 'atendida' && !isAtendida) return false;
      if (status === 'nao_atendida' && isAtendida) return false;
    }

    // Queue / tech filter
    if (fila !== 'todos' && d.fila !== fila) return false;

    // Direction filter (IN / OUT)
    if (tipoChamada !== 'todos') {
      const t = d.tipo.toUpperCase();
      if (tipoChamada === 'IN' && !t.includes('IN') && !t.includes('ENTRADA')) return false;
      if (tipoChamada === 'OUT' && !t.includes('OUT') && !t.includes('SAÍDA') && !t.includes('SAIDA')) return false;
    }

    return true;
  });
}

/**
 * Calculates General KPIs based on the user's business logic
 */
export function calcularKpis(dadosFiltrados: CallRecord[]): GeneralKpis {
  let totalAtendidas = 0;
  let totalNaoAtendidas = 0;
  let totalManha = 0;
  let totalTarde = 0;
  let tempoTotal = 0;

  // Hourly counts to identify peak and quietest hour
  const hourlyCount: Record<number, number> = {};
  const hourlyDuration: Record<number, number> = {};
  const hourlyAnswered: Record<number, number> = {};

  for (let h = 0; h < 24; h++) {
    hourlyCount[h] = 0;
    hourlyDuration[h] = 0;
    hourlyAnswered[h] = 0;
  }

  for (const d of dadosFiltrados) {
    const isAtendida = d.status.toLowerCase().includes('atendida') && !d.status.toLowerCase().includes('não');

    hourlyCount[d.horaInt] = (hourlyCount[d.horaInt] || 0) + 1;

    if (isAtendida) {
      totalAtendidas++;
      tempoTotal += d.segundos;
      hourlyDuration[d.horaInt] = (hourlyDuration[d.horaInt] || 0) + d.segundos;
      hourlyAnswered[d.horaInt] = (hourlyAnswered[d.horaInt] || 0) + 1;

      // Check morning (08:15 to 13:00) and afternoon (13:00 to 21:00) logic from user's script
      const timeParts = d.hora.split(':');
      const h = parseInt(timeParts[0], 10) || 0;
      const m = parseInt(timeParts[1], 10) || 0;
      const totalMinutes = h * 60 + m;

      // 08:15 = 495 mins, 13:00 = 780 mins
      if (totalMinutes >= 495 && totalMinutes < 780) {
        totalManha++;
      }
      // 13:00 = 780 mins, 21:00 = 1260 mins
      else if (totalMinutes >= 780 && totalMinutes <= 1260) {
        totalTarde++;
      }
    } else {
      totalNaoAtendidas++;
    }
  }

  const totalGeral = dadosFiltrados.length;
  const taxaAtendimentoGeral = totalGeral > 0 ? (totalAtendidas / totalGeral) * 100 : 0;
  const tma = totalAtendidas > 0 ? tempoTotal / totalAtendidas : 0;

  // Find peak hour and calmest hour
  let peakHour = 9;
  let peakMax = -1;
  let quietHour = 12;
  let quietMin = Infinity;

  for (let h = 7; h <= 21; h++) {
    const count = hourlyCount[h] || 0;
    if (count > peakMax) {
      peakMax = count;
      peakHour = h;
    }
    if (count > 0 && count < quietMin) {
      quietMin = count;
      quietHour = h;
    }
  }

  if (peakMax <= 0) {
    peakMax = 0;
    peakHour = 10;
  }
  if (quietMin === Infinity) {
    quietMin = 0;
    quietHour = 13;
  }

  const peakTma = hourlyAnswered[peakHour] > 0
    ? hourlyDuration[peakHour] / hourlyAnswered[peakHour]
    : 0;

  const alertas: string[] = [];
  if (tma > 300) {
    alertas.push('⚠️ O Tempo Médio de Atendimento (TMA) geral está acima de 05:00 minutos!');
  }
  if (taxaAtendimentoGeral < 85 && totalGeral > 20) {
    alertas.push(`⚠️ Taxa de atendimento abaixo do esperado (${taxaAtendimentoGeral.toFixed(1)}%). Atenção para chamadas abandonadas.`);
  }

  return {
    totalGeral,
    totalAtendidas,
    totalNaoAtendidas,
    taxaAtendimentoGeral,
    totalManha,
    totalTarde,
    tempoTotalSegundos: tempoTotal,
    tempoTotalFormatado: formatSecondsToHoursMinutes(tempoTotal),
    tmaSegundos: Math.round(tma),
    tmaFormatado: formatSecondsToMinutesSeconds(tma),
    horaPico: {
      faixa: `${peakHour.toString().padStart(2, '0')}:00 - ${(peakHour + 1).toString().padStart(2, '0')}:00`,
      total: peakMax,
      tma: formatSecondsToMinutesSeconds(peakTma),
    },
    horaMaisTranquila: {
      faixa: `${quietHour.toString().padStart(2, '0')}:00 - ${(quietHour + 1).toString().padStart(2, '0')}:00`,
      total: quietMin,
    },
    alertas,
  };
}

/**
 * Calculates hourly statistics breakdown (e.g. 08:00 - 08:59, 09:00 - 09:59)
 * with call center staffing recommendation for shift planning!
 */
export function calcularEstatisticasPorHora(
  dados: CallRecord[],
  horaInicio: number = 7,
  horaFim: number = 21,
  metaOcupacao: number = 0.8 // 80% de ocupação ideal
): HourlyStats[] {
  const totalVolumePeriodo = dados.length;

  // Find max volume in any hour to calculate relative load
  const contagemPorHora: Record<number, number> = {};
  for (let h = horaInicio; h <= horaFim; h++) {
    contagemPorHora[h] = 0;
  }
  for (const d of dados) {
    if (d.horaInt >= horaInicio && d.horaInt <= horaFim) {
      contagemPorHora[d.horaInt] = (contagemPorHora[d.horaInt] || 0) + 1;
    }
  }

  const volumes = Object.values(contagemPorHora);
  const maxVolume = Math.max(...volumes, 1);
  const mediaVolume = volumes.length > 0 ? volumes.reduce((a, b) => a + b, 0) / volumes.length : 1;

  const resultado: HourlyStats[] = [];

  for (let h = horaInicio; h <= horaFim; h++) {
    const chamadasDaHora = dados.filter((d) => d.horaInt === h);
    const totalChamadas = chamadasDaHora.length;

    let atendidas = 0;
    let naoAtendidas = 0;
    let tempoTotalSegundos = 0;
    const filasCount: Record<string, number> = {};

    for (const c of chamadasDaHora) {
      const isAtendida = c.status.toLowerCase().includes('atendida') && !c.status.toLowerCase().includes('não');
      if (isAtendida) {
        atendidas++;
        tempoTotalSegundos += c.segundos;
      } else {
        naoAtendidas++;
      }

      const nomeFila = c.fila || 'Não Identificado';
      filasCount[nomeFila] = (filasCount[nomeFila] || 0) + 1;
    }

    const tma = atendidas > 0 ? tempoTotalSegundos / atendidas : 0;
    const taxaAtendimento = totalChamadas > 0 ? (atendidas / totalChamadas) * 100 : 0;
    const percentualVolume = totalVolumePeriodo > 0 ? (totalChamadas / totalVolumePeriodo) * 100 : 0;

    // Nível de carga para cores visuais
    let nivelCarga: 'baixo' | 'moderado' | 'alto' | 'pico' = 'baixo';
    if (totalChamadas >= maxVolume * 0.85 && totalChamadas > 5) {
      nivelCarga = 'pico';
    } else if (totalChamadas >= mediaVolume * 1.15) {
      nivelCarga = 'alto';
    } else if (totalChamadas >= mediaVolume * 0.6) {
      nivelCarga = 'moderado';
    } else {
      nivelCarga = 'baixo';
    }

    // Dimensionamento de Atendentes Recomendados:
    // Carga de trabalho em Erlangs = (Chamadas na hora * TMA em segundos) / 3600
    // Atendentes = Math.ceil(Carga / metaOcupacao) + margem de segurança
    let atendentesRecomendados = 1;
    if (totalChamadas > 0) {
      const cargaErlangs = (totalChamadas * (tma > 0 ? tma : 180)) / 3600;
      // Taxa de ocupação ideal: evita que atendente fique 100% ocupado sem fôlego (burnout)
      const baseAtendentes = cargaErlangs / Math.max(0.5, metaOcupacao);
      // Fator de segurança para fila / simultaneidade (Square root law de call center)
      const buffer = Math.sqrt(Math.max(1, cargaErlangs)) * 0.5;
      atendentesRecomendados = Math.max(1, Math.ceil(baseAtendentes + buffer));
    } else {
      atendentesRecomendados = 1; // Mínimo de prontidão de suporte
    }

    // Ordenar principais filas dessa hora
    const filasPrincipais = Object.entries(filasCount)
      .map(([fila, qtd]) => ({ fila, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 3);

    const proximaHora = (h + 1).toString().padStart(2, '0');
    const horaFormatada = h.toString().padStart(2, '0');

    resultado.push({
      hora: h,
      faixaHoraria: `${horaFormatada}:00 - ${proximaHora}:00`,
      faixaSimples: `${horaFormatada}h`,
      totalChamadas,
      atendidas,
      naoAtendidas,
      taxaAtendimento,
      tempoTotalSegundos,
      tempoTotalFormatado: formatSecondsToHoursMinutes(tempoTotalSegundos),
      tmaSegundos: Math.round(tma),
      tmaFormatado: formatSecondsToMinutesSeconds(tma),
      percentualVolume,
      nivelCarga,
      atendentesRecomendados,
      filasPrincipais,
    });
  }

  return resultado;
}

/**
 * Technician and Queue Ranking (from user's original script logic)
 */
export function gerarRankingTecnicos(dados: CallRecord[]): TechnicianRank[] {
  const tecnicosDados: Record<string, { chamadas: number; segundos: number }> = {};
  let totalChamadasAtendidasGeral = 0;

  for (const d of dados) {
    const isAtendida = d.status.toLowerCase().includes('atendida') && !d.status.toLowerCase().includes('não');
    if (!isAtendida) continue;

    const tipo = d.tipo.toUpperCase();
    if (!tipo.includes('IN') && !tipo.includes('ENTRADA')) continue;

    const tecnico = d.fila ? d.fila.trim() : 'Não Identificado';
    if (!tecnicosDados[tecnico]) {
      tecnicosDados[tecnico] = { chamadas: 0, segundos: 0 };
    }

    tecnicosDados[tecnico].chamadas += 1;
    tecnicosDados[tecnico].segundos += d.segundos;
    totalChamadasAtendidasGeral += 1;
  }

  const resultado: TechnicianRank[] = [];

  for (const [tecnico, info] of Object.entries(tecnicosDados)) {
    const tma = info.chamadas > 0 ? info.segundos / info.chamadas : 0;
    const percentual = totalChamadasAtendidasGeral > 0 ? (info.chamadas / totalChamadasAtendidasGeral) * 100 : 0;

    resultado.push({
      tecnico,
      chamadas: info.chamadas,
      segundos: info.segundos,
      tempoFormatado: formatSecondsToHoursMinutes(info.segundos),
      tmaSegundos: Math.round(tma),
      tmaFormatado: formatSecondsToMinutesSeconds(tma),
      percentualTotal: percentual,
    });
  }

  return resultado.sort((a, b) => b.chamadas - a.chamadas);
}

/**
 * Intelligent Shift & Break Planning recommendations
 */
export function gerarPlanoEscala(
  statsPorHora: HourlyStats[],
  metaOcupacao: number = 0.8
): ShiftPlanRecommendation {
  if (statsPorHora.length === 0) {
    return {
      metaOcupacao,
      horarioPicoMaximo: 'Sem dados',
      recomendacoesPausaAlmoco: [],
      alertasGargalo: [],
      turnosSugeridos: {
        manha: { horario: '08:00 às 14:00', atendentes: 2, volumeMedioHora: 0, observacao: 'Dados insuficientes' },
        intermediario: { horario: '10:00 às 16:00', atendentes: 2, volumeMedioHora: 0, observacao: 'Dados insuficientes' },
        tarde: { horario: '13:00 às 21:00', atendentes: 2, volumeMedioHora: 0, observacao: 'Dados insuficientes' },
      },
    };
  }

  // Find max peak
  const pico = [...statsPorHora].sort((a, b) => b.totalChamadas - a.totalChamadas)[0];

  // Divide into shifts:
  // Manhã: 08:00 - 13:00
  const horasManha = statsPorHora.filter((s) => s.hora >= 8 && s.hora < 13);
  // Intermediário / Pico: 10:00 - 16:00
  const horasIntermediario = statsPorHora.filter((s) => s.hora >= 10 && s.hora < 16);
  // Tarde / Noite: 13:00 - 21:00
  const horasTarde = statsPorHora.filter((s) => s.hora >= 13 && s.hora <= 21);

  const calcTurnoStats = (horas: HourlyStats[]) => {
    if (horas.length === 0) return { avgChamadas: 0, maxAtendentes: 1, sumChamadas: 0 };
    const sumChamadas = horas.reduce((acc, h) => acc + h.totalChamadas, 0);
    const avgChamadas = Math.round(sumChamadas / horas.length);
    const maxAtendentes = Math.max(...horas.map((h) => h.atendentesRecomendados), 1);
    return { avgChamadas, maxAtendentes, sumChamadas };
  };

  const stManha = calcTurnoStats(horasManha);
  const stInter = calcTurnoStats(horasIntermediario);
  const stTarde = calcTurnoStats(horasTarde);

  // Recommendations for Lunch / Breaks:
  // Find hours with lowest volume between 11:00 and 15:00
  const horasAlmoco = statsPorHora
    .filter((s) => s.hora >= 11 && s.hora <= 15)
    .sort((a, b) => a.totalChamadas - b.totalChamadas);

  const recomendacoesPausaAlmoco: string[] = [];
  if (horasAlmoco.length > 0) {
    const melhorHoraAlmoco1 = horasAlmoco[0];
    const melhorHoraAlmoco2 = horasAlmoco.length > 1 ? horasAlmoco[1] : null;

    recomendacoesPausaAlmoco.push(
      `🍽️ Janela prioritária para 1º turno de almoço: ${melhorHoraAlmoco1.faixaHoraria} (Volume baixo: apenas ${melhorHoraAlmoco1.totalChamadas} chamadas).`
    );
    if (melhorHoraAlmoco2) {
      recomendacoesPausaAlmoco.push(
        `🍽️ Janela recomendada para 2º turno de almoço: ${melhorHoraAlmoco2.faixaHoraria} (${melhorHoraAlmoco2.totalChamadas} chamadas).`
      );
    }
  }

  // Bottleneck alerts
  const alertasGargalo: string[] = [];
  if (pico && pico.totalChamadas > 0) {
    alertasGargalo.push(
      `🚨 HORÁRIO DE PICO CRÍTICO: ${pico.faixaHoraria} com ${pico.totalChamadas} ligações (${pico.percentualVolume.toFixed(1)}% do volume total). Recomenda-se escala reforçada com no mínimo ${pico.atendentesRecomendados} atendentes ativos sem saídas para intervalos.`
    );
  }

  const horasComAbandonoAlto = statsPorHora.filter((s) => s.naoAtendidas >= 3 && s.taxaAtendimento < 80);
  for (const h of horasComAbandonoAlto) {
    alertasGargalo.push(
      `⚠️ Gargalo em ${h.faixaHoraria}: Taxa de atendimento em ${h.taxaAtendimento.toFixed(1)}% com ${h.naoAtendidas} chamadas não atendidas. Aumentar em +1 atendente nessa faixa.`
    );
  }

  return {
    metaOcupacao,
    horarioPicoMaximo: pico ? `${pico.faixaHoraria} (${pico.totalChamadas} chamadas)` : 'N/D',
    recomendacoesPausaAlmoco,
    alertasGargalo,
    turnosSugeridos: {
      manha: {
        horario: '08:00 às 14:00 (Turno Manhã)',
        atendentes: stManha.maxAtendentes,
        volumeMedioHora: stManha.avgChamadas,
        observacao: `Cobre a abertura e o pico matinal (09h-11h). Necessário manter ${stManha.maxAtendentes} operadores a postos.`,
      },
      intermediario: {
        horario: '10:00 às 16:00 (Turno Reforço/Almoço)',
        atendentes: Math.max(1, Math.round(stInter.maxAtendentes * 0.7)),
        volumeMedioHora: stInter.avgChamadas,
        observacao: `Essencial para cobrir as saídas de almoço dos colegas das 11:30 às 14:30 sem desfalcar as filas.`,
      },
      tarde: {
        horario: '13:00 às 21:00 (Turno Tarde/Fechamento)',
        atendentes: stTarde.maxAtendentes,
        volumeMedioHora: stTarde.avgChamadas,
        observacao: `Atende o fluxo da tarde e o pós-expediente comercial até as 21h.`,
      },
    },
  };
}
