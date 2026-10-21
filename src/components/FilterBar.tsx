import React from 'react';
import { Calendar, Clock, Filter, RotateCcw, ChevronDown, Check, RefreshCw, Search } from 'lucide-react';
import { FilterOptions } from '../types';

interface FilterBarProps {
  filtros: FilterOptions;
  setFiltros: React.Dispatch<React.SetStateAction<FilterOptions>>;
  filasDisponiveis: string[];
  onAplicar: () => void;
  onReset: () => void;
  onConsultarPabx?: () => void;
  isSyncing?: boolean;
  syncProgress?: string;
  isLive?: boolean;
  totalFiltrado: number;
  totalOriginal: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filtros,
  setFiltros,
  filasDisponiveis,
  onAplicar,
  onReset,
  onConsultarPabx,
  isSyncing,
  syncProgress,
  isLive,
  totalFiltrado,
  totalOriginal,
}) => {
  // Shortcut helper for dates
  const aplicarAtalhoData = (tipo: 'hoje' | 'ontem' | '7dias' | 'mes') => {
    const hoje = new Date();
    const formatYMD = (d: Date) => {
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const dia = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${dia}`;
    };

    if (tipo === 'hoje') {
      const hStr = formatYMD(hoje);
      setFiltros((prev) => ({ ...prev, dataInicio: hStr, dataFim: hStr }));
    } else if (tipo === 'ontem') {
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const oStr = formatYMD(ontem);
      setFiltros((prev) => ({ ...prev, dataInicio: oStr, dataFim: oStr }));
    } else if (tipo === '7dias') {
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 6);
      setFiltros((prev) => ({
        ...prev,
        dataInicio: formatYMD(seteDiasAtras),
        dataFim: formatYMD(hoje),
      }));
    } else if (tipo === 'mes') {
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setFiltros((prev) => ({
        ...prev,
        dataInicio: formatYMD(inicioMes),
        dataFim: formatYMD(hoje),
      }));
    }
  };

  // Shortcut helper for time intervals
  const aplicarAtalhoHorario = (inicio: number, fim: number) => {
    setFiltros((prev) => ({
      ...prev,
      horaInicio: inicio,
      horaFim: fim,
    }));
  };

  const horas = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg mb-6">
      <div className="flex flex-col gap-4">
        
        {/* Top Header & Quick Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-400" />
            <span>Filtros de Período & Faixa de Horário</span>
            <span className="text-xs font-normal text-slate-400 ml-1">
              ({totalFiltrado} de {totalOriginal} chamadas selecionadas)
            </span>
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-slate-400 font-medium mr-1">Atalhos Data:</span>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('hoje')}
              className="px-2.5 py-1 rounded-md bg-slate-700/70 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('ontem')}
              className="px-2.5 py-1 rounded-md bg-slate-700/70 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition cursor-pointer"
            >
              Ontem
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('7dias')}
              className="px-2.5 py-1 rounded-md bg-slate-700/70 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition cursor-pointer"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => aplicarAtalhoData('mes')}
              className="px-2.5 py-1 rounded-md bg-slate-700/70 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition cursor-pointer"
            >
              Mês Atual
            </button>
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Data Inicial e Final */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data Inicial</span>
            </label>
            <input
              type="date"
              value={filtros.dataInicio}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data Final</span>
            </label>
            <input
              type="date"
              value={filtros.dataFim}
              onChange={(e) => setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 [color-scheme:dark]"
            />
          </div>

          {/* Horário Inicial e Final */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horário Inicial</span>
              </label>
              <span className="text-[11px] font-mono text-amber-300">
                {filtros.horaInicio.toString().padStart(2, '0')}:00
              </span>
            </div>
            <select
              value={filtros.horaInicio}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFiltros((prev) => ({
                  ...prev,
                  horaInicio: val,
                  horaFim: Math.max(val, prev.horaFim),
                }));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:00 ({h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Horário Final</span>
              </label>
              <span className="text-[11px] font-mono text-amber-300">
                {filtros.horaFim.toString().padStart(2, '0')}:59
              </span>
            </div>
            <select
              value={filtros.horaFim}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setFiltros((prev) => ({
                  ...prev,
                  horaFim: val,
                  horaInicio: Math.min(val, prev.horaInicio),
                }));
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {horas.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:59 ({h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Filters: Status, Queue, Direction & Shift Presets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Status da Ligação</label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="todos">Todos os Status (Atendidas e Não Atendidas)</option>
              <option value="atendida">Somente Atendidas</option>
              <option value="nao_atendida">Somente Não Atendidas / Abandonadas</option>
            </select>
          </div>

          {/* Fila / Técnico */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Fila ou Técnico</label>
            <select
              value={filtros.fila}
              onChange={(e) => setFiltros((prev) => ({ ...prev, fila: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="todos">Todas as Filas e Técnicos</option>
              {filasDisponiveis.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Chamada */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Tipo de Chamada</label>
            <select
              value={filtros.tipoChamada}
              onChange={(e) => setFiltros((prev) => ({ ...prev, tipoChamada: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="IN">Entrada (Recebidas no PABX)</option>
              <option value="OUT">Saída (Realizadas)</option>
              <option value="todos">Todas (Entrada + Saída)</option>
            </select>
          </div>

          {/* Quick Shift Presets & Reset */}
          <div className="flex flex-col justify-end space-y-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(8, 18)}
                className="flex-1 py-2 px-2 text-[11px] font-medium rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/70 text-center transition cursor-pointer"
                title="Filtrar das 08:00 às 18:00 (Comercial)"
              >
                08h às 18h
              </button>
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(8, 21)}
                className="flex-1 py-2 px-2 text-[11px] font-medium rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/70 text-center transition cursor-pointer"
                title="Filtrar das 08:00 às 21:00 (Expediente Manhã + Tarde)"
              >
                08h às 21h
              </button>
              <button
                type="button"
                onClick={() => aplicarAtalhoHorario(0, 23)}
                className="flex-1 py-2 px-2 text-[11px] font-medium rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 border border-slate-600/70 text-center transition cursor-pointer"
                title="Filtrar 24 Horas completas"
              >
                24 Horas
              </button>
              <button
                type="button"
                onClick={onReset}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition cursor-pointer"
                title="Limpar todos os filtros para o padrão"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Row: Consultar PABX + Live Progress */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onConsultarPabx}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Buscar todas as páginas do período selecionado diretamente no PABX Evence"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Carregando Mês Completo...' : '🔍 Consultar Período no PABX'}</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Puxa todas as páginas do CDR para o intervalo de datas selecionado (incluindo mês completo).
            </span>
          </div>

          {/* Mode label */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Origem:</span>
            <span
              className={`px-2.5 py-1 rounded-md font-semibold text-xs border ${
                isLive
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {isLive ? '● PABX Ao Vivo' : '○ Modo Demonstração'}
            </span>
          </div>
        </div>

        {/* Live Progress Bar if syncing */}
        {isSyncing && (
          <div className="p-3 bg-blue-950/80 border border-blue-500/40 rounded-xl text-xs text-blue-200 flex items-center justify-between animate-pulse shadow-md">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              <span className="font-medium">{syncProgress || 'Processando bilhetes do CDR no PABX Evence...'}</span>
            </div>
            <span className="text-[11px] text-blue-300 font-mono hidden md:inline">
              Carregando em tempo real...
            </span>
          </div>
        )}

      </div>
    </div>
  );
};
