import React, { useState } from 'react';
import { Search, Phone, ArrowDownLeft, ArrowUpRight, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CallRecord } from '../types';

interface CallDetailTableProps {
  calls: CallRecord[];
  selectedHour?: number | null;
  onClearHourFilter?: () => void;
}

export const CallDetailTable: React.FC<CallDetailTableProps> = ({
  calls,
  selectedHour,
  onClearHourFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter by search query
  const filteredCalls = calls.filter((c) => {
    if (selectedHour !== null && selectedHour !== undefined && c.horaInt !== selectedHour) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.dataHora.toLowerCase().includes(term) ||
      c.fila.toLowerCase().includes(term) ||
      c.status.toLowerCase().includes(term) ||
      c.origem.toLowerCase().includes(term) ||
      c.destino.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCalls.length / itemsPerPage));
  const currentCalls = filteredCalls.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              Detalhamento de Chamadas CDR
            </h3>
            {selectedHour !== null && selectedHour !== undefined && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40">
                <span>Filtrando: {selectedHour.toString().padStart(2, '0')}:00 às {(selectedHour + 1).toString().padStart(2, '0')}:00</span>
                <button
                  type="button"
                  onClick={onClearHourFilter}
                  className="hover:text-white cursor-pointer ml-1"
                  title="Limpar filtro de hora"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mostrando {filteredCalls.length} chamadas individuais registradas pelo PABX.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por fila, número..."
            className="w-full bg-slate-800 text-xs text-slate-100 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Calls Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-700 tracking-wider">
              <th className="py-3 px-4">Data e Hora</th>
              <th className="py-3 px-4">Origem</th>
              <th className="py-3 px-4">Destino / DID</th>
              <th className="py-3 px-4">Fila / Atendente</th>
              <th className="py-3 px-4">Duração</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-center">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {currentCalls.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Nenhuma chamada encontrada correspondente aos critérios.
                </td>
              </tr>
            ) : (
              currentCalls.map((c, i) => {
                const isAtendida = c.status.toLowerCase().includes('atendida') && !c.status.toLowerCase().includes('não');

                return (
                  <tr key={c.id || i} className="hover:bg-slate-800/50 transition-colors">
                    {/* Data e Hora */}
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {c.dataHora}
                    </td>

                    {/* Origem */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {c.origem || 'Anônimo'}
                    </td>

                    {/* Destino */}
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {c.destino || '-'}
                    </td>

                    {/* Fila / Atendente */}
                    <td className="py-3 px-4 font-medium text-slate-100">
                      {c.fila || 'Não Identificado'}
                    </td>

                    {/* Duração */}
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {c.duracao}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          isAtendida
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Tipo */}
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs border border-slate-700">
                        {c.tipo}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 bg-slate-800/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong> ({filteredCalls.length} chamadas)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 border border-slate-700 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
