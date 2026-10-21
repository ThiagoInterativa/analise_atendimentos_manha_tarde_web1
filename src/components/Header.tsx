import React from 'react';
import { PhoneCall, RefreshCw, Settings, ShieldCheck, Database, HelpCircle, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  isLive: boolean;
  isSyncing: boolean;
  onSync: () => void;
  onToggleLiveDemo: () => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  syncProgress?: string;
  totalRecords: number;
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  isSyncing,
  onSync,
  onToggleLiveDemo,
  onOpenSettings,
  onExportCsv,
  syncProgress,
  totalRecords,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <PhoneCall className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-100">
                  PABX Analytics & Otimizador de Escala
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Interativa Net • Análise de tráfego por hora e dimensionamento de turnos
              </p>
            </div>
          </div>

          {/* Status & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Mode Indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isLive
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                  : 'bg-amber-950/60 text-amber-300 border-amber-700/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isLive ? 'PABX Conectado' : 'Modo Demonstração'}</span>
              <button
                type="button"
                onClick={onToggleLiveDemo}
                className="ml-1 underline text-[11px] opacity-80 hover:opacity-100 cursor-pointer"
                title="Clique para alternar entre dados reais do PABX e simulação"
              >
                (Alternar)
              </button>
            </div>

            {/* Sync Button */}
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? (syncProgress || 'Buscando...') : 'Sincronizar PABX'}</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={onExportCsv}
              disabled={totalRecords === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer disabled:opacity-40"
              title="Exportar todas as ligações filtradas em formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {/* PABX Settings Modal Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Configurações de login e servidor do PABX"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Progress Notice if active */}
        {isSyncing && syncProgress && (
          <div className="mt-2.5 py-1 px-3 bg-blue-950/80 border border-blue-700/60 rounded-md text-xs text-blue-200 flex items-center justify-between animate-pulse">
            <span>⏳ {syncProgress}</span>
            <span className="text-[11px] text-blue-300">Aguardando paginação do CDR...</span>
          </div>
        )}
      </div>
    </header>
  );
};
