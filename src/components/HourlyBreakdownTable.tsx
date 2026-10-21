import React from 'react';
import { Clock, Users, ArrowUpRight, ArrowDownRight, Flame, Coffee, Eye, Download, FileSpreadsheet } from 'lucide-react';
import { HourlyStats } from '../types';

interface HourlyBreakdownTableProps {
  hourlyStats: HourlyStats[];
  onSelectHour?: (hour: number) => void;
  selectedHour?: number | null;
}

export const HourlyBreakdownTable: React.FC<HourlyBreakdownTableProps> = ({
  hourlyStats,
  onSelectHour,
  selectedHour,
}) => {

  // Totals calculations for the footer
  const totalChamadas = hourlyStats.reduce((acc, curr) => acc + curr.totalChamadas, 0);
  const totalAtendidas = hourlyStats.reduce((acc, curr) => acc + curr.atendidas, 0);
  const totalNaoAtendidas = hourlyStats.reduce((acc, curr) => acc + curr.naoAtendidas, 0);
  const totalSegundos = hourlyStats.reduce((acc, curr) => acc + curr.tempoTotalSegundos, 0);
  const totalHorasFmt = `${Math.floor(totalSegundos / 3600)}h ${Math.floor((totalSegundos % 3600) / 60)}m`;
  const tmaGeralSegundos = totalAtendidas > 0 ? totalSegundos / totalAtendidas : 0;
  const tmaGeralFmt = `${Math.floor(tmaGeralSegundos / 60).toString().padStart(2, '0')}:${Math.round(tmaGeralSegundos % 60).toString().padStart(2, '0')}`;
  const maxChamadas = Math.max(...hourlyStats.map((h) => h.totalChamadas), 1);

  const getShiftBadge = (hora: number) => {
    if (hora >= 8 && hora < 12) return { label: 'Manhã', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
    if (hora >= 12 && hora < 14) return { label: 'Almoço', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
    if (hora >= 14 && hora < 18) return { label: 'Tarde', bg: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
    if (hora >= 18 && hora < 22) return { label: 'Noite', bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30' };
    return { label: 'Madrugada', bg: 'bg-slate-500/10 text-slate-400 border-slate-600/30' };
  };

  const getLoadBadge = (nivel: HourlyStats['nivelCarga']) => {
    switch (nivel) {
      case 'pico':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
            <Flame className="w-3 h-3 text-red-400" />
            Pico Crítico
          </span>
        );
      case 'alto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/40">
            <ArrowUpRight className="w-3 h-3 text-orange-400" />
            Movimento Alto
          </span>
        );
      case 'moderado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
            Moderado
          </span>
        );
      case 'baixo':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Coffee className="w-3 h-3 text-emerald-400" />
            Tranquilo
          </span>
        );
    }
  };

  // Export full hourly table to CSV
  const exportarTabelaCsv = () => {
    const headers = [
      'Faixa Horária',
      'Turno',
      'Total de Ligações',
      'Chamadas Atendidas',
      'Chamadas Não Atendidas / Abandonadas',
      'Taxa de Atendimento (%)',
      'TMA (mm:ss)',
      'Tempo Total Conversado',
      '% do Volume Diário',
      'Nível de Demanda',
      'Escala Sugerida (Atendentes Recomendados)',
    ];

    const rows = hourlyStats.map((item) => {
      const shift = getShiftBadge(item.hora).label;
      const load =
        item.nivelCarga === 'pico'
          ? 'Pico Crítico'
          : item.nivelCarga === 'alto'
          ? 'Movimento Alto'
          : item.nivelCarga === 'moderado'
          ? 'Moderado'
          : 'Tranquilo';

      return [
        `"${item.faixaHoraria}"`,
        `"${shift}"`,
        item.totalChamadas,
        item.atendidas,
        item.naoAtendidas,
        `"${item.totalChamadas > 0 ? item.taxaAtendimento.toFixed(1) + '%' : '-'}"`,
        `"${item.tmaFormatado}"`,
        `"${item.tempoTotalFormatado}"`,
        `"${item.percentualVolume.toFixed(1)}%"`,
        `"${load}"`,
        item.atendentesRecomendados,
      ];
    });

    // Summary row
    rows.push([
      '"TOTAL GERAL NO INTERVALO"',
      '"Todos"',
      totalChamadas,
      totalAtendidas,
      totalNaoAtendidas,
      `"${totalChamadas > 0 ? ((totalAtendidas / totalChamadas) * 100).toFixed(1) + '%' : '-'}"`,
      `"${tmaGeralFmt}"`,
      `"${totalHorasFmt}"`,
      '"100%"',
      '"-"',
      `"Pico: ${Math.max(...hourlyStats.map((h) => h.atendentesRecomendados), 1)} máx"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'tabela_ligacoes_somadas_por_hora.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Header of the table card with Export Option */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h2 className="text-base sm:text-lg font-bold text-slate-100">
            Listagem de Ligações Somadas por Hora
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
            {hourlyStats.length} Faixas Horárias
          </span>
          <button
            type="button"
            onClick={exportarTabelaCsv}
            disabled={hourlyStats.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition cursor-pointer disabled:opacity-40"
            title="Exportar a tabela completa somada por hora em formato CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Tabela (CSV)</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-700 tracking-wider">
              <th className="py-3 px-4">Faixa Horária</th>
              <th className="py-3 px-4">Turno</th>
              <th className="py-3 px-4 min-w-[140px]">Total Ligações</th>
              <th className="py-3 px-4">Atendidas / Abandonadas</th>
              <th className="py-3 px-4 text-center">Taxa (%)</th>
              <th className="py-3 px-4">TMA (mm:ss)</th>
              <th className="py-3 px-4">Tempo Total</th>
              <th className="py-3 px-4 text-center">Nível de Carga</th>
              <th className="py-3 px-4 text-center">Escala Sugerida</th>
              <th className="py-3 px-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {hourlyStats.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500">
                  Nenhuma ligação encontrada para o intervalo selecionado.
                </td>
              </tr>
            ) : (
              hourlyStats.map((item) => {
                const shift = getShiftBadge(item.hora);
                const isSelected = selectedHour === item.hora;
                const percentBar = maxChamadas > 0 ? (item.totalChamadas / maxChamadas) * 100 : 0;
                const isTmaHigh = item.tmaSegundos > 300;

                return (
                  <tr
                    key={item.hora}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      isSelected
                        ? 'bg-blue-950/40 border-l-4 border-l-blue-500'
                        : item.nivelCarga === 'pico'
                        ? 'bg-red-950/10'
                        : ''
                    }`}
                  >
                    {/* Faixa Horária */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{item.faixaHoraria}</span>
                      </div>
                    </td>

                    {/* Turno */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 text-[11px] font-medium rounded-md border ${shift.bg}`}>
                        {shift.label}
                      </span>
                    </td>

                    {/* Total de Ligações & Barra Visual */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between font-bold text-slate-100 mb-1">
                        <span>{item.totalChamadas} chamadas</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          {item.percentualVolume.toFixed(1)}% do dia
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.nivelCarga === 'pico'
                              ? 'bg-red-500'
                              : item.nivelCarga === 'alto'
                              ? 'bg-orange-500'
                              : item.nivelCarga === 'moderado'
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentBar}%` }}
                        />
                      </div>
                    </td>

                    {/* Atendidas / Não Atendidas */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 font-semibold">{item.atendidas} atendidas</span>
                        {item.naoAtendidas > 0 && (
                          <span className="text-red-400 font-medium text-xs">
                            ({item.naoAtendidas} perdidas)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Taxa de Atendimento (%) */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-semibold text-xs px-2 py-0.5 rounded ${
                          item.taxaAtendimento >= 90
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.taxaAtendimento >= 75
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {item.totalChamadas > 0 ? `${item.taxaAtendimento.toFixed(0)}%` : '-'}
                      </span>
                    </td>

                    {/* TMA */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`font-bold ${
                            isTmaHigh ? 'text-amber-400 font-extrabold' : 'text-slate-200'
                          }`}
                        >
                          {item.tmaFormatado}
                        </span>
                        {isTmaHigh && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/40">
                            alto
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tempo Total */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {item.tempoTotalFormatado}
                    </td>

                    {/* Nível de Carga */}
                    <td className="py-3.5 px-4 text-center">
                      {getLoadBadge(item.nivelCarga)}
                    </td>

                    {/* Escala Recomendada */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-xs">
                        <Users className="w-3.5 h-3.5 text-blue-400" />
                        <span>{item.atendentesRecomendados} atendente{item.atendentesRecomendados > 1 ? 's' : ''}</span>
                      </div>
                    </td>

                    {/* Ação Filtrar CDR */}
                    <td className="py-3.5 px-4 text-center">
                      {onSelectHour && (
                        <button
                          type="button"
                          onClick={() => onSelectHour(item.hora)}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          }`}
                          title={`Ver as chamadas individuais das ${item.faixaHoraria}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Summary */}
          {hourlyStats.length > 0 && (
            <tfoot className="bg-slate-800/90 font-semibold text-slate-200 border-t-2 border-slate-700 text-xs">
              <tr>
                <td className="py-3.5 px-4" colSpan={2}>
                  TOTAL GERAL NO INTERVALO
                </td>
                <td className="py-3.5 px-4 text-blue-300 font-bold text-sm">
                  {totalChamadas} chamadas
                </td>
                <td className="py-3.5 px-4 text-emerald-400">
                  {totalAtendidas} atendidas ({totalNaoAtendidas} perdidas)
                </td>
                <td className="py-3.5 px-4 text-center">
                  {totalChamadas > 0 ? `${((totalAtendidas / totalChamadas) * 100).toFixed(0)}%` : '-'}
                </td>
                <td className="py-3.5 px-4 font-mono text-cyan-300">
                  {tmaGeralFmt} (médio)
                </td>
                <td className="py-3.5 px-4 font-mono text-slate-200">
                  {totalHorasFmt}
                </td>
                <td className="py-3.5 px-4 text-center text-slate-400">
                  -
                </td>
                <td className="py-3.5 px-4 text-center text-blue-300">
                  Pico: {Math.max(...hourlyStats.map(h => h.atendentesRecomendados))} máx
                </td>
                <td className="py-3.5 px-4 text-center">
                  -
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
