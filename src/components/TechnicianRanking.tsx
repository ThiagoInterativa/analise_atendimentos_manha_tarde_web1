import React from 'react';
import { Award, Trophy, Timer, PhoneCall, TrendingUp } from 'lucide-react';
import { TechnicianRank } from '../types';

interface TechnicianRankingProps {
  ranking: TechnicianRank[];
}

export const TechnicianRanking: React.FC<TechnicianRankingProps> = ({ ranking }) => {
  const maxChamadas = ranking.length > 0 ? ranking[0].chamadas : 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">
              Ranking de Atendimento por Técnico / Fila
            </h3>
            <p className="text-xs text-slate-400">
              Desempenho individual, volume de chamadas atendidas e Tempo Médio de Atendimento (TMA).
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
          {ranking.length} Atendentes/Filas
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-800/80 text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-700 tracking-wider">
              <th className="py-3 px-4 w-16 text-center">Posição</th>
              <th className="py-3 px-4">Técnico / Fila</th>
              <th className="py-3 px-4 min-w-[150px]">Chamadas Atendidas</th>
              <th className="py-3 px-4 text-center">% do Volume</th>
              <th className="py-3 px-4">Tempo Total</th>
              <th className="py-3 px-4">TMA (mm:ss)</th>
              <th className="py-3 px-4 text-center">Status TMA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ranking.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Nenhum dado de atendimento encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              ranking.map((item, index) => {
                const percent = (item.chamadas / maxChamadas) * 100;
                const isTmaHigh = item.tmaSegundos > 300;

                return (
                  <tr key={item.tecnico} className="hover:bg-slate-800/50 transition-colors">
                    {/* Posição com Medalha */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                          🥇 1º
                        </span>
                      ) : index === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/40 text-xs">
                          🥈 2º
                        </span>
                      ) : index === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-600 border border-amber-700/40 text-xs">
                          🥉 3º
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">{index + 1}º</span>
                      )}
                    </td>

                    {/* Nome Técnico / Fila */}
                    <td className="py-3.5 px-4 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{item.tecnico}</span>
                      </div>
                    </td>

                    {/* Chamadas & Barra Relativa */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between text-slate-200 font-bold mb-1">
                        <span>{item.chamadas}</span>
                        <span className="text-[11px] text-slate-400 font-normal">atendidas</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* % do Volume Total */}
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-300">
                      {item.percentualTotal.toFixed(1)}%
                    </td>

                    {/* Tempo Total */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {item.tempoFormatado}
                    </td>

                    {/* TMA Formatado */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {item.tmaFormatado}
                    </td>

                    {/* Status TMA */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          item.tmaSegundos <= 240
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : item.tmaSegundos <= 300
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.tmaSegundos <= 240
                          ? 'Excelente'
                          : item.tmaSegundos <= 300
                          ? 'Na Média'
                          : 'TMA Alto (>5m)'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
