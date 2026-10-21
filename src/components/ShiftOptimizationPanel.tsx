import React, { useState } from 'react';
import { Users, Clock, ShieldAlert, CheckCircle, Sliders, CalendarClock, Coffee, AlertTriangle } from 'lucide-react';
import { HourlyStats, ShiftPlanRecommendation } from '../types';

interface ShiftOptimizationPanelProps {
  hourlyStats: HourlyStats[];
  shiftPlan: ShiftPlanRecommendation;
  metaOcupacao: number;
  setMetaOcupacao: (val: number) => void;
}

export const ShiftOptimizationPanel: React.FC<ShiftOptimizationPanelProps> = ({
  hourlyStats,
  shiftPlan,
  metaOcupacao,
  setMetaOcupacao,
}) => {
  const [jornadaHoras, setJornadaHoras] = useState(6); // 6h padrão de teleatendimento / CLT
  const [tamanhoEquipeAtual, setTamanhoEquipeAtual] = useState(6);

  const maxAtendentesNecessarios = Math.max(
    ...hourlyStats.map((h) => h.atendentesRecomendados),
    1
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl mb-8">
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Otimizador de Escala & Dimensionamento da Equipe
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste os turnos de trabalho, horários de almoço e tamanho da equipe com base no volume real de chamadas do PABX.
              </p>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/80">
          <div className="flex items-center gap-2 text-xs">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span className="text-slate-300 font-medium">Meta Ocupação:</span>
            <select
              value={metaOcupacao}
              onChange={(e) => setMetaOcupacao(parseFloat(e.target.value))}
              className="bg-slate-900 text-purple-300 font-bold border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-purple-400"
            >
              <option value="0.7">70% (Mais Folga)</option>
              <option value="0.75">75% (Equilibrado)</option>
              <option value="0.8">80% (Padrão Telecom)</option>
              <option value="0.85">85% (Alta Eficiência)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-slate-300 font-medium">Equipe Atual:</span>
            <input
              type="number"
              min={1}
              max={30}
              value={tamanhoEquipeAtual}
              onChange={(e) => setTamanhoEquipeAtual(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-14 bg-slate-900 text-blue-300 font-bold border border-slate-700 rounded-lg px-2 py-1 text-xs text-center"
            />
            <span className="text-slate-400">técnicos</span>
          </div>
        </div>
      </div>

      {/* Suggested Shifts 3-Column Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
        
        {/* Turno Manhã */}
        <div className="bg-slate-800/60 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Turno 1 • Manhã</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              08:00 - 14:00
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {shiftPlan.turnosSugeridos.manha.atendentes} Atendentes
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {shiftPlan.turnosSugeridos.manha.observacao}
          </p>
          <div className="text-[11px] text-amber-300/80 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50">
            📊 Média de {shiftPlan.turnosSugeridos.manha.volumeMedioHora} ligações por hora neste turno.
          </div>
        </div>

        {/* Turno Intermediário / Cobertura de Almoço */}
        <div className="bg-slate-800/60 border border-blue-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Turno 2 • Intermediário</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">
              10:00 - 16:00
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {shiftPlan.turnosSugeridos.intermediario.atendentes} Atendentes
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {shiftPlan.turnosSugeridos.intermediario.observacao}
          </p>
          <div className="text-[11px] text-blue-300/80 bg-blue-950/40 p-2 rounded-lg border border-blue-800/50">
            🛡️ Crucial para suprir as saídas para almoço sem sobrecarregar a fila.
          </div>
        </div>

        {/* Turno Tarde / Fechamento */}
        <div className="bg-slate-800/60 border border-indigo-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Turno 3 • Tarde/Noite</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              13:00 - 21:00
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-100 my-1">
            {shiftPlan.turnosSugeridos.tarde.atendentes} Atendentes
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            {shiftPlan.turnosSugeridos.tarde.observacao}
          </p>
          <div className="text-[11px] text-indigo-300/80 bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/50">
            🌙 Absorve o segundo pico (14h-16h) e mantém atendimento até 21h.
          </div>
        </div>

      </div>

      {/* Rules for Breaks & Bottleneck Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Janelas Recomendadas de Almoço */}
        <div className="bg-slate-800/50 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-emerald-400 font-semibold text-xs sm:text-sm">
            <Coffee className="w-4 h-4" />
            <span>Janelas Estratégicas para Pausas e Almoço</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            {shiftPlan.recomendacoesPausaAlmoco.length > 0 ? (
              shiftPlan.recomendacoesPausaAlmoco.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Sem dados suficientes para cálculo de pausas.</p>
            )}
            <div className="text-[11px] text-slate-400 pt-1">
              ✨ <strong>Estratégia:</strong> Fazer o rodízio em duplas nessas janelas garante que o tempo de espera não ultrapasse a meta de TMA.
            </div>
          </div>
        </div>

        {/* Alertas de Gargalo & Pico */}
        <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-red-400 font-semibold text-xs sm:text-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Alertas de Subdimensionamento e Bloqueio de Pausas</span>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            {shiftPlan.alertasGargalo.length > 0 ? (
              shiftPlan.alertasGargalo.map((alerta, i) => (
                <div key={i} className="flex items-start gap-2 bg-red-950/30 p-2.5 rounded-lg border border-red-800/40">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{alerta}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-500">Nenhum gargalo detectado.</p>
            )}
            <div className="text-[11px] text-slate-400 pt-1">
              🚫 <strong>Regra de Ouro:</strong> Nunca autorizar pausas prolongadas ou reuniões de equipe durante o horário de pico máximo.
            </div>
          </div>
        </div>

      </div>

      {/* Staff Capacity Status bar */}
      <div className="mt-5 p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-slate-300">
            Capacidade da Equipe Atual (<strong>{tamanhoEquipeAtual} técnicos</strong>) vs Necessidade Máxima no Pico (<strong>{maxAtendentesNecessarios} técnicos</strong>):
          </span>
        </div>
        <div>
          {tamanhoEquipeAtual >= maxAtendentesNecessarios ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">
              <CheckCircle className="w-3.5 h-3.5" />
              Equipe bem dimensionada para absorver o pico
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              Déficit de {maxAtendentesNecessarios - tamanhoEquipeAtual} operador(es) no horário de pico!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
