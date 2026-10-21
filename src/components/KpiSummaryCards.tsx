import React from 'react';
import { PhoneIncoming, Sun, Moon, Clock, Timer, Flame, Coffee, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { GeneralKpis } from '../types';

interface KpiSummaryCardsProps {
  kpis: GeneralKpis;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({ kpis }) => {
  const exportarCardsCsv = () => {
    const headers = ['Métrica', 'Valor', 'Observação / Detalhes'];
    const rows = [
      ['Total Geral de Ligações', kpis.totalGeral, 'Volume recebido no período'],
      ['Total de Ligações Atendidas', kpis.totalAtendidas, `${kpis.taxaAtendimentoGeral.toFixed(1)}% taxa de atendimento`],
      ['Total Não Atendidas / Abandonadas', kpis.totalNaoAtendidas, `${(100 - kpis.taxaAtendimentoGeral).toFixed(1)}% abandono`],
      ['Manhã (08h15 às 13h00)', kpis.totalManha, `${kpis.totalAtendidas > 0 ? ((kpis.totalManha / kpis.totalAtendidas) * 100).toFixed(0) : 0}% das atendidas`],
      ['Tarde (13h00 às 21h00)', kpis.totalTarde, `${kpis.totalAtendidas > 0 ? ((kpis.totalTarde / kpis.totalAtendidas) * 100).toFixed(0) : 0}% das atendidas`],
      ['Tempo Total Conversado', kpis.tempoTotalFormatado, 'Horas faladas pela equipe'],
      ['Tempo Médio de Atendimento (TMA)', kpis.tmaFormatado, kpis.tmaSegundos > 300 ? 'Acima da meta de 5 minutos' : 'Dentro da meta'],
      ['Horário de Pico Máximo', kpis.horaPico.faixa, `${kpis.horaPico.total} chamadas (TMA ${kpis.horaPico.tma})`],
      ['Horário Mais Tranquilo', kpis.horaMaisTranquila.faixa, `${kpis.horaMaisTranquila.total} chamadas`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'resumo_cards_kpis_pabx.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 mb-6">
      
      {/* Alertas se houverem (igual ao script do usuário) */}
      {kpis.alertas.length > 0 && (
        <div className="space-y-2">
          {kpis.alertas.map((alerta, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs sm:text-sm font-medium shadow-sm"
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span>{alerta}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top bar with Export option for Cards */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Resumo Geral de Indicadores
        </span>
        <button
          type="button"
          onClick={exportarCardsCsv}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer shadow-sm"
          title="Exportar dados dos cards em formato CSV"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Exportar Cards (CSV)</span>
        </button>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Atendidas */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Total Atendidas</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <PhoneIncoming className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{kpis.totalAtendidas}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
              <span>{kpis.taxaAtendimentoGeral.toFixed(1)}% taxa</span>
              <span className="text-slate-600">•</span>
              <span>{kpis.totalGeral} total</span>
            </div>
          </div>
        </div>

        {/* Manhã (08:15 às 13:00) */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Manhã (08h15-13h)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Sun className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-300">{kpis.totalManha}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.totalAtendidas > 0 ? ((kpis.totalManha / kpis.totalAtendidas) * 100).toFixed(0) : 0}% das atendidas
            </div>
          </div>
        </div>

        {/* Tarde (13:00 às 21:00) */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Tarde (13h-21h)</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
              <Moon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-300">{kpis.totalTarde}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.totalAtendidas > 0 ? ((kpis.totalTarde / kpis.totalAtendidas) * 100).toFixed(0) : 0}% das atendidas
            </div>
          </div>
        </div>

        {/* Tempo Total Conversado */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Tempo Total</span>
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-100">{kpis.tempoTotalFormatado}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Horas conversadas
            </div>
          </div>
        </div>

        {/* TMA Formatado */}
        <div className={`bg-slate-800/90 border rounded-xl p-4 shadow-sm flex flex-col justify-between ${
          kpis.tmaSegundos > 300 ? 'border-amber-500/50 bg-amber-950/20' : 'border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>TMA Médio</span>
            <div className={`p-1.5 rounded-lg ${
              kpis.tmaSegundos > 300 ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/15 text-cyan-400'
            }`}>
              <Timer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${kpis.tmaSegundos > 300 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {kpis.tmaFormatado}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {kpis.tmaSegundos > 300 ? 'Meta > 05:00 (Alto)' : 'Dentro da meta'}
            </div>
          </div>
        </div>

        {/* Horário de Pico */}
        <div className="bg-slate-800/90 border border-red-500/30 rounded-xl p-4 shadow-sm flex flex-col justify-between bg-gradient-to-br from-red-950/20 to-transparent">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span className="text-red-400 font-semibold">Horário de Pico</span>
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-base font-bold text-red-300 truncate">{kpis.horaPico.faixa}</div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
              <span className="font-semibold text-red-400">{kpis.horaPico.total} chamadas</span>
              <span>• TMA {kpis.horaPico.tma}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
