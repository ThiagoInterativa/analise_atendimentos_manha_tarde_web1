import React from 'react';
import { TrendingUp, Download, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { HourlyStats } from '../types';

interface HourlyChartProps {
  hourlyStats: HourlyStats[];
  onSelectHour?: (hour: number) => void;
  selectedHour?: number | null;
}

export const HourlyChart: React.FC<HourlyChartProps> = ({
  hourlyStats,
  onSelectHour,
  selectedHour,
}) => {
  if (hourlyStats.length === 0) return null;

  const maxChamadas = Math.max(...hourlyStats.map((h) => h.totalChamadas), 1);
  const mediaChamadas = Math.round(
    hourlyStats.reduce((acc, h) => acc + h.totalChamadas, 0) / (hourlyStats.length || 1)
  );

  // Export curve points to CSV
  const exportarCurvaCsv = () => {
    const headers = [
      'Faixa Horária',
      'Hora (0-23)',
      'Total de Ligações',
      '% do Volume do Dia',
      'Atendidas',
      'Não Atendidas / Abandonadas',
      'Taxa de Atendimento (%)',
      'TMA (mm:ss)',
      'Tempo Total Conversado',
      'Atendentes Recomendados',
      'Nível de Carga',
    ];

    const rows = hourlyStats.map((h) => {
      const nivel =
        h.nivelCarga === 'pico'
          ? 'Pico Crítico'
          : h.nivelCarga === 'alto'
          ? 'Alto'
          : h.nivelCarga === 'moderado'
          ? 'Moderado'
          : 'Baixo';

      return [
        `"${h.faixaHoraria}"`,
        h.hora,
        h.totalChamadas,
        `"${h.percentualVolume.toFixed(1)}%"`,
        h.atendidas,
        h.naoAtendidas,
        `"${h.totalChamadas > 0 ? h.taxaAtendimento.toFixed(1) + '%' : '-'}"`,
        `"${h.tmaFormatado}"`,
        `"${h.tempoTotalFormatado}"`,
        h.atendentesRecomendados,
        `"${nivel}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'curva_movimento_por_horario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export chart as high-resolution PNG image
  const exportarGraficoPng = () => {
    const width = 1200;
    const height = 520;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Header Title & Subtitle
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Curva de Movimento por Horário & Picos de Tráfego - PABX', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Média de ${mediaChamadas} chamadas/hora • Total analisado no intervalo: ${hourlyStats.reduce((a, b) => a + b.totalChamadas, 0)} chamadas`, 40, 80);

    // Chart dimensions
    const chartX = 50;
    const chartY = 120;
    const chartW = width - 100;
    const chartH = 300;
    const baseY = chartY + chartH;

    // Baseline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartX, baseY);
    ctx.lineTo(chartX + chartW, baseY);
    ctx.stroke();

    const n = hourlyStats.length;
    const slotW = chartW / n;
    const barW = Math.min(42, Math.max(16, slotW * 0.65));

    hourlyStats.forEach((item, i) => {
      const centerX = chartX + i * slotW + slotW / 2;
      const barH = (item.totalChamadas / maxChamadas) * (chartH - 40);
      const barX = centerX - barW / 2;
      const barY = baseY - barH;

      // Color based on load
      let color = '#10b981'; // emerald
      if (item.nivelCarga === 'pico') color = '#ef4444';
      else if (item.nivelCarga === 'alto') color = '#f97316';
      else if (item.nivelCarga === 'moderado') color = '#eab308';

      // Rounded bar top
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Top count label
      ctx.fillStyle = item.nivelCarga === 'pico' ? '#f87171' : '#e2e8f0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.totalChamadas.toString(), centerX, barY - 8);

      // Hour label below
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(item.faixaSimples, centerX, baseY + 24);
    });

    // Legend at bottom
    ctx.textAlign = 'left';
    ctx.font = '12px sans-serif';
    const legY = height - 30;

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(chartX, legY - 10, 12, 12);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Pico Crítico (>85%)', chartX + 18, legY);

    ctx.fillStyle = '#f97316';
    ctx.fillRect(chartX + 180, legY - 10, 12, 12);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Alto', chartX + 198, legY);

    ctx.fillStyle = '#eab308';
    ctx.fillRect(chartX + 270, legY - 10, 12, 12);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Moderado', chartX + 288, legY);

    ctx.fillStyle = '#10b981';
    ctx.fillRect(chartX + 390, legY - 10, 12, 12);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Baixo / Pausas', chartX + 408, legY);

    // Download canvas as PNG
    const link = document.createElement('a');
    link.download = 'curva_movimento_pabx.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl mb-8">
      {/* Chart Title, Legend and Export Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-slate-100">
              Curva de Movimento por Horário & Picos de Tráfego
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Média de <strong className="text-slate-200">{mediaChamadas} chamadas/hora</strong> no intervalo filtrado.
          </p>
        </div>

        {/* Legend & Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-2.5 text-xs mr-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-slate-300">Pico</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-slate-300">Alto</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-slate-300">Moderado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Baixo</span>
            </div>
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={exportarCurvaCsv}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer shadow-sm"
              title="Exportar dados da curva de movimento em formato CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              <span>Exportar Curva (CSV)</span>
            </button>
            <button
              type="button"
              onClick={exportarGraficoPng}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer shadow-sm"
              title="Baixar imagem em PNG de alta resolução do gráfico"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Exportar Gráfico (PNG)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Bars Container */}
      <div className="pt-8 pb-4 overflow-x-auto">
        <div className="flex items-end gap-2 min-w-[650px] h-48 px-2 border-b border-slate-700/80">
          {hourlyStats.map((item) => {
            const heightPercent = Math.max(8, Math.round((item.totalChamadas / maxChamadas) * 100));
            const isSelected = selectedHour === item.hora;
            const isPeak = item.nivelCarga === 'pico';

            return (
              <div
                key={item.hora}
                onClick={() => onSelectHour && onSelectHour(item.hora)}
                className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
              >
                {/* Floating tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-16 bg-slate-800 text-slate-100 text-[11px] p-2 rounded-lg border border-slate-700 shadow-xl pointer-events-none z-20 whitespace-nowrap">
                  <div className="font-bold text-blue-400">{item.faixaHoraria}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span>📞 {item.totalChamadas} ligações</span>
                    <span>⏱️ TMA {item.tmaFormatado}</span>
                  </div>
                  <div className="text-amber-300 font-semibold mt-0.5">
                    👥 Sugestão: {item.atendentesRecomendados} operador{item.atendentesRecomendados > 1 ? 'es' : ''}
                  </div>
                </div>

                {/* Top Call Count Label */}
                <span
                  className={`text-[11px] font-bold mb-1.5 transition-colors ${
                    isPeak
                      ? 'text-red-400 scale-110'
                      : isSelected
                      ? 'text-blue-400'
                      : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {item.totalChamadas}
                </span>

                {/* The Bar Element */}
                <div
                  className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 group-hover:brightness-125 ${
                    isPeak
                      ? 'bg-gradient-to-t from-red-600 to-red-400 shadow-lg shadow-red-500/20'
                      : item.nivelCarga === 'alto'
                      ? 'bg-gradient-to-t from-orange-600 to-orange-400'
                      : item.nivelCarga === 'moderado'
                      ? 'bg-gradient-to-t from-yellow-600 to-yellow-400'
                      : 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                  } ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : ''}`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Staffing requirement indicator tag */}
                <div className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-blue-300">
                  {item.faixaSimples}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
