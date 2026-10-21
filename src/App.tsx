import React, { useState, useMemo, useEffect } from 'react';
import {
  Header
} from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { HourlyBreakdownTable } from './components/HourlyBreakdownTable';
import { HourlyChart } from './components/HourlyChart';
import { ShiftOptimizationPanel } from './components/ShiftOptimizationPanel';
import { TechnicianRanking } from './components/TechnicianRanking';
import { CallDetailTable } from './components/CallDetailTable';
import { PabxConfigModal } from './components/PabxConfigModal';
import {
  CallRecord,
  FilterOptions,
  PabxCredentials,
} from './types';
import {
  filtrarChamadas,
  calcularKpis,
  calcularEstatisticasPorHora,
  gerarRankingTecnicos,
  gerarPlanoEscala,
} from './utils/calculations';
import { gerarDadosDemonstracao } from './utils/mockData';
import { Clock, CalendarClock, Trophy, Phone, Sparkles } from 'lucide-react';

export default function App() {
  // Today's date in YYYY-MM-DD
  const hoje = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${dia}`;
  }, []);

  // Filter state
  const [filtros, setFiltros] = useState<FilterOptions>({
    dataInicio: hoje,
    dataFim: hoje,
    horaInicio: 7,
    horaFim: 21,
    status: 'todos',
    fila: 'todos',
    tipoChamada: 'IN',
  });

  // PABX Credentials (pre-filled with user credentials)
  const [credentials, setCredentials] = useState<PabxCredentials>(() => {
    const saved = localStorage.getItem('pabx_credentials');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      loginUrl: 'https://pabx.evence.com.br/login',
      cdrUrl: 'https://pabx.evence.com.br/cdr/pesquisar',
      email: 'suporte@interativanet.com.br',
      senha: 'smk03657',
    };
  });

  // Dataset state (initialized with realistic demonstration dataset)
  const [allCalls, setAllCalls] = useState<CallRecord[]>(() => {
    return gerarDadosDemonstracao(hoje, hoje);
  });

  // UI States
  const [isLive, setIsLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [metaOcupacao, setMetaOcupacao] = useState(0.8);
  const [activeTab, setActiveTab] = useState<'hourly' | 'shift' | 'ranking' | 'calls'>('hourly');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Extract unique queues / technician names from all data
  const filasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    allCalls.forEach((c) => {
      if (c.fila) set.add(c.fila);
    });
    return Array.from(set).sort();
  }, [allCalls]);

  // Filter calls according to filter settings
  const filteredCalls = useMemo(() => {
    return filtrarChamadas(allCalls, filtros);
  }, [allCalls, filtros]);

  // Hourly Breakdown Stats
  const hourlyStats = useMemo(() => {
    return calcularEstatisticasPorHora(
      filteredCalls,
      filtros.horaInicio,
      filtros.horaFim,
      metaOcupacao
    );
  }, [filteredCalls, filtros.horaInicio, filtros.horaFim, metaOcupacao]);

  // General KPIs (Manhã 8h15-13h, Tarde 13h-21h, etc.)
  const generalKpis = useMemo(() => {
    return calcularKpis(filteredCalls);
  }, [filteredCalls]);

  // Technician / Queue Ranking
  const rankingTecnicos = useMemo(() => {
    return gerarRankingTecnicos(filteredCalls);
  }, [filteredCalls]);

  // Shift & Break Optimization Plan
  const shiftPlan = useMemo(() => {
    return gerarPlanoEscala(hourlyStats, metaOcupacao);
  }, [hourlyStats, metaOcupacao]);

  // Sync with PABX live via Server-Sent Events stream or fallback
  const handleSyncPabx = async () => {
    setIsSyncing(true);
    setSyncProgress('Iniciando conexão com PABX Evence...');
    setIsLive(true); // Maintain live mode!

    try {
      const queryParams = new URLSearchParams({
        loginUrl: credentials.loginUrl,
        cdrUrl: credentials.cdrUrl,
        email: credentials.email,
        senha: credentials.senha,
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
        tipoChamada: filtros.tipoChamada === 'todos' ? '' : filtros.tipoChamada,
      });

      const response = await fetch(`/api/pabx/consultar-stream?${queryParams.toString()}`);

      if (!response.ok || !response.body) {
        throw new Error(`Falha na resposta do servidor: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedCalls: CallRecord[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;

          const eventMatch = line.match(/^event:\s*(\w+)/m);
          const dataMatch = line.match(/^data:\s*(.+)$/m);

          const eventType = eventMatch ? eventMatch[1] : 'message';
          const dataStr = dataMatch ? dataMatch[1] : null;

          if (!dataStr) continue;

          try {
            const dataObj = JSON.parse(dataStr);

            if (eventType === 'status') {
              setSyncProgress(dataObj.message || 'Consultando PABX...');
            } else if (eventType === 'page') {
              setSyncProgress(
                `Processando página ${dataObj.page} de ${dataObj.totalPages} (${dataObj.totalCallsSoFar} ligações no período)...`
              );
              if (Array.isArray(dataObj.newRecords) && dataObj.newRecords.length > 0) {
                // Deduplicate calls by dataHora and origem
                const existingMap = new Map(receivedCalls.map(c => [`${c.dataHora}_${c.origem}_${c.destino}`, c]));
                dataObj.newRecords.forEach((item: CallRecord) => {
                  const key = `${item.dataHora}_${item.origem}_${item.destino}`;
                  if (!existingMap.has(key)) {
                    existingMap.set(key, item);
                    receivedCalls.push(item);
                  }
                });
                setAllCalls([...receivedCalls]);
              }
            } else if (eventType === 'complete') {
              if (Array.isArray(dataObj.dados) && dataObj.dados.length > 0) {
                receivedCalls = dataObj.dados;
                setAllCalls(receivedCalls);
              }
              setSyncProgress('');
              setIsLive(true);
              showToast(
                `✅ Período completo carregado com sucesso! ${receivedCalls.length} ligações sincronizadas do PABX Evence.`,
                'success'
              );
            } else if (eventType === 'error') {
              console.warn('[PABX Stream Error]', dataObj.message);
              showToast(`Aviso do PABX: ${dataObj.message}`, 'error');
            }
          } catch (e) {
            console.error('Erro ao decodificar evento SSE:', e);
          }
        }
      }

      if (receivedCalls.length > 0) {
        setIsLive(true);
      }
    } catch (err: any) {
      console.warn('Erro ao consultar stream do PABX, tentando sincronização direta:', err);
      try {
        setSyncProgress('Processando relatório do período...');
        const res = await fetch('/api/pabx/consultar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            loginUrl: credentials.loginUrl,
            cdrUrl: credentials.cdrUrl,
            email: credentials.email,
            senha: credentials.senha,
            dataInicio: filtros.dataInicio,
            dataFim: filtros.dataFim,
            tipoChamada: filtros.tipoChamada === 'todos' ? '' : filtros.tipoChamada,
            maxPaginas: 100,
          }),
        });
        const resData = await res.json();
        if (res.ok && resData.success && Array.isArray(resData.dados) && resData.dados.length > 0) {
          setAllCalls(resData.dados);
          setIsLive(true);
          showToast(`✅ Sincronizado! ${resData.dados.length} ligações carregadas do PABX.`, 'success');
        } else {
          showToast('Não foi possível obter dados para este período do PABX. Tente novamente.', 'error');
        }
      } catch (postErr: any) {
        showToast(`Erro na consulta ao PABX: ${postErr.message || 'Falha de rede'}`, 'error');
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress('');
    }
  };

  // Main consultation action: respects current mode
  const handleConsultarPeriodo = () => {
    if (isLive) {
      handleSyncPabx();
    } else {
      // In demo mode: generate complete month/period without going blank
      const demoData = gerarDadosDemonstracao(filtros.dataInicio, filtros.dataFim);
      setAllCalls(demoData);
      showToast(`Dados de simulação do período (${demoData.length} ligações) atualizados com sucesso.`, 'info');
    }
  };

  // Toggle Live vs Demo
  const handleToggleLiveDemo = () => {
    if (isLive) {
      setIsLive(false);
      const demoData = gerarDadosDemonstracao(filtros.dataInicio, filtros.dataFim);
      setAllCalls(demoData);
      showToast('Modo demonstração ativado com dados do período.', 'info');
    } else {
      setIsLive(true);
      handleSyncPabx();
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (filteredCalls.length === 0) return;

    const headers = ['Data e Hora', 'Origem', 'Destino', 'Fila/Técnico', 'Duração', 'Segundos', 'Status', 'Tipo'];
    const rows = filteredCalls.map((c) => [
      `"${c.dataHora}"`,
      `"${c.origem}"`,
      `"${c.destino}"`,
      `"${c.fila}"`,
      `"${c.duracao}"`,
      c.segundos,
      `"${c.status}"`,
      `"${c.tipo}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_pabx_${filtros.dataInicio}_ate_${filtros.dataFim}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV baixado com sucesso!', 'success');
  };

  // Reset filters
  const handleResetFilters = () => {
    setFiltros({
      dataInicio: hoje,
      dataFim: hoje,
      horaInicio: 7,
      horaFim: 21,
      status: 'todos',
      fila: 'todos',
      tipoChamada: 'IN',
    });
    setSelectedHour(null);
    showToast('Filtros restaurados para o padrão.', 'info');
  };

  // Save Credentials
  const handleSaveCredentials = (creds: PabxCredentials) => {
    setCredentials(creds);
    localStorage.setItem('pabx_credentials', JSON.stringify(creds));
    showToast('Credenciais do PABX salvas com sucesso!', 'success');
  };

  // Test connection
  const handleTestConnection = async (creds: PabxCredentials): Promise<boolean> => {
    try {
      const res = await fetch('/api/pabx/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginUrl: creds.loginUrl,
          cdrUrl: creds.cdrUrl,
          email: creds.email,
          senha: creds.senha,
          dataInicio: hoje,
          dataFim: hoje,
          tipoChamada: 'IN',
          maxPaginas: 1,
        }),
      });
      const data = await res.json();
      return res.ok && data.success === true;
    } catch {
      return false;
    }
  };

  // Click on an hour to drill-down
  const handleSelectHour = (hour: number) => {
    if (selectedHour === hour) {
      setSelectedHour(null);
    } else {
      setSelectedHour(hour);
      // Automatically switch to call detail tab if user wants to see specific records
      setActiveTab('calls');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium flex items-center gap-2.5 max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                : toastMessage.type === 'error'
                ? 'bg-red-950 border-red-600 text-red-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        isLive={isLive}
        isSyncing={isSyncing}
        onSync={handleSyncPabx}
        onToggleLiveDemo={handleToggleLiveDemo}
        onOpenSettings={() => setIsConfigOpen(true)}
        onExportCsv={handleExportCsv}
        syncProgress={syncProgress}
        totalRecords={allCalls.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Filter Bar with Date and Hour interval selection */}
        <FilterBar
          filtros={filtros}
          setFiltros={setFiltros}
          filasDisponiveis={filasDisponiveis}
          onAplicar={() => setSelectedHour(null)}
          onReset={handleResetFilters}
          onConsultarPabx={handleConsultarPeriodo}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          isLive={isLive}
          totalFiltrado={filteredCalls.length}
          totalOriginal={allCalls.length}
        />

        {/* General KPI summary cards */}
        <KpiSummaryCards kpis={generalKpis} />

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'hourly'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Listagem por Hora & Picos</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-300">
              {hourlyStats.length} faixas
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shift')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'shift'
                ? 'border-purple-500 text-purple-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <CalendarClock className="w-4 h-4" />
            <span>Otimizador de Escala & Turnos</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-purple-500/10 text-purple-300">
              Dimensionamento
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'ranking'
                ? 'border-amber-500 text-amber-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Ranking por Técnico/Fila</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-300">
              {rankingTecnicos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'calls'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Detalhamento de Chamadas (CDR)</span>
            <span className="text-[11px] px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300">
              {filteredCalls.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Hourly breakdown (Core User Request) */}
        {activeTab === 'hourly' && (
          <div className="space-y-6">
            {/* Visual Movement Curve / Hourly Bars */}
            <HourlyChart
              hourlyStats={hourlyStats}
              onSelectHour={handleSelectHour}
              selectedHour={selectedHour}
            />

            {/* Listagem das ligações somadas por hora */}
            <HourlyBreakdownTable
              hourlyStats={hourlyStats}
              onSelectHour={handleSelectHour}
              selectedHour={selectedHour}
            />
          </div>
        )}

        {/* Tab 2: Shift Optimization Panel */}
        {activeTab === 'shift' && (
          <div className="space-y-6">
            <ShiftOptimizationPanel
              hourlyStats={hourlyStats}
              shiftPlan={shiftPlan}
              metaOcupacao={metaOcupacao}
              setMetaOcupacao={setMetaOcupacao}
            />

            {/* Also show the hourly table for reference */}
            <HourlyBreakdownTable
              hourlyStats={hourlyStats}
              onSelectHour={handleSelectHour}
              selectedHour={selectedHour}
            />
          </div>
        )}

        {/* Tab 3: Technician Ranking */}
        {activeTab === 'ranking' && (
          <div className="space-y-6">
            <TechnicianRanking ranking={rankingTecnicos} />
          </div>
        )}

        {/* Tab 4: Individual Calls Detailed Table */}
        {activeTab === 'calls' && (
          <div className="space-y-6">
            <CallDetailTable
              calls={filteredCalls}
              selectedHour={selectedHour}
              onClearHourFilter={() => setSelectedHour(null)}
            />
          </div>
        )}

      </main>

      {/* PABX Credentials Modal */}
      <PabxConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        credentials={credentials}
        onSave={handleSaveCredentials}
        onTestConnection={handleTestConnection}
      />
    </div>
  );
}
