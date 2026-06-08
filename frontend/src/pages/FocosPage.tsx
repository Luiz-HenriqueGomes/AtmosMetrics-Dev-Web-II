import { useEffect, useState } from 'react';
import { Thermometer, ChevronLeft, ChevronRight, Filter, X, Download, ThermometerSun, Snowflake } from 'lucide-react';
import { api, type ClimaItem, type PaisOut, type ContinenteOut } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import './FocosPage.css';

const PAGE_SIZE = 100;

export default function FocosPage() {
  const [data, setData] = useState<ClimaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [continente, setContinente] = useState('');
  const [pais, setPais] = useState('');

  // Opções para selects
  const [paises, setPaises] = useState<PaisOut[]>([]);
  const [continentes, setContinentes] = useState<ContinenteOut[]>([]);

  // Carrega opções de filtro ao montar
  useEffect(() => {
    api.getPaises().then(setPaises).catch(() => {});
    api.getContinentes().then(setContinentes).catch(() => {});
  }, []);

  // Países filtrados pelo continente selecionado
  const paisesFiltrados = continente
    ? paises.filter(p => p.continente === continente)
    : paises;

  // Carrega dados quando filtros ou offset mudam
  useEffect(() => {
    setLoading(true);
    setError(null);

    const filters = {
      limit: PAGE_SIZE,
      offset,
      ...(dataInicio && { data_inicio: dataInicio }),
      ...(dataFim && { data_fim: dataFim }),
      ...(pais && { pais }),
      ...(continente && { continente }),
    };

    api.getClimaExtremas(filters)
      .then(setData)
      .catch(() => setError('Não foi possível carregar as temperaturas extremas.'))
      .finally(() => setLoading(false));
  }, [offset, dataInicio, dataFim, pais, continente]);

  const handleFilter = () => {
    setOffset(0); // Reset para página 1 ao filtrar
  };

  const clearFilters = () => {
    setDataInicio('');
    setDataFim('');
    setContinente('');
    setPais('');
    setOffset(0);
  };

  // Ao mudar continente, reseta o país
  const handleContinenteChange = (value: string) => {
    setContinente(value);
    setPais('');
    handleFilter();
  };

  const exportPDF = () => {
    if (data.length === 0) return;
    const doc = new jsPDF();
    doc.text('Relatorio de Temperaturas Extremas - AtmosMetrics', 14, 15);
    
    const tableData = data.map(item => [
      item.data_completa ?? '-',
      item.pais ?? '-',
      item.continente ?? '-',
      (item.pais === 'Brasil' && !item.municipio?.startsWith('Grid')) ? (item.municipio ?? '-') : '—',
      item.temperatura_max ? `${Number(item.temperatura_max).toFixed(1)}°C` : '-',
      item.temperatura_min ? `${Number(item.temperatura_min).toFixed(1)}°C` : '-',
      item.velocidade_vento ? `${Number(item.velocidade_vento).toFixed(1)} km/h` : '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'País', 'Continente', 'Município', 'Temp Máx', 'Temp Mín', 'Vento']],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
    });

    doc.save('atmosmetrics_temperaturas_extremas.pdf');
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const csvData = data.map(item => ({
      Data: item.data_completa,
      Pais: item.pais,
      Continente: item.continente,
      Municipio: (item.pais === 'Brasil' && !item.municipio?.startsWith('Grid')) ? item.municipio : '—',
      Latitude: item.latitude,
      Longitude: item.longitude,
      TempMax: item.temperatura_max,
      TempMin: item.temperatura_min,
      Precipitacao: item.precipitacao_mm,
      Vento: item.velocidade_vento
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'atmosmetrics_temperaturas_extremas.csv';
    link.click();
  };

  const hasActiveFilters = dataInicio || dataFim || pais || continente;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="focos-page">
      {/* Header */}
      <div className="focos-header">
        <div>
          <h1 className="focos-title">Temperaturas Extremas</h1>
          <p className="focos-subtitle">
            Monitoramento global de ondas de calor (≥ 35°C) e frio extremo (≤ 0°C)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="focos-filter-toggle" onClick={exportCSV} disabled={data.length === 0 || loading} title="Exportar para CSV">
            <Download size={14} /> CSV
          </button>
          <button className="focos-filter-toggle" onClick={exportPDF} disabled={data.length === 0 || loading} title="Exportar para PDF">
            <Download size={14} /> PDF
          </button>
          <button
            className={`focos-filter-toggle ${filtersOpen ? 'active' : ''}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Filter size={14} />
            Filtros
            {hasActiveFilters && <span className="filter-badge" />}
          </button>
        </div>
      </div>

      {/* Filtros */}
      {filtersOpen && (
        <div className="focos-filters panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Continente</label>
              <select className="filter-input" value={continente} onChange={e => handleContinenteChange(e.target.value)}>
                <option value="">Todos</option>
                {continentes.map(c => (
                  <option key={c.continente} value={c.continente}>{c.continente}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">País</label>
              <select className="filter-input" value={pais} onChange={e => { setPais(e.target.value); handleFilter(); }}>
                <option value="">Todos</option>
                {paisesFiltrados.map(p => (
                  <option key={p.pais} value={p.pais}>{p.pais}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Data Início</label>
              <input
                className="filter-input"
                type="date"
                value={dataInicio}
                onChange={e => { setDataInicio(e.target.value); handleFilter(); }}
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Data Fim</label>
              <input
                className="filter-input"
                type="date"
                value={dataFim}
                onChange={e => { setDataFim(e.target.value); handleFilter(); }}
              />
            </div>

            {hasActiveFilters && (
              <div className="filter-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="filter-clear" onClick={clearFilters}>
                  <X size={12} />
                  Limpar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="error-banner">
          <Thermometer size={16} />
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="focos-table-wrap panel">
        <div className="focos-table-header">
          <span className="focos-table-count">
            {loading ? 'Carregando...' : `${data.length} registros exibidos`}
            {hasActiveFilters && ' (filtrado)'}
          </span>
          <span className="focos-table-page">Página {currentPage}</span>
        </div>

        <div className="focos-table-scroll">
          <table className="focos-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Data</th>
                <th>País</th>
                <th>Continente</th>
                <th>Município</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Temp Máx</th>
                <th>Temp Mín</th>
                <th>Precip (mm)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j}><div className="skeleton-cell" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="focos-empty">
                    <Thermometer size={20} />
                    <span>Nenhum registro extremo encontrado no período.</span>
                  </td>
                </tr>
              ) : (
                data.map(item => {
                  const isHot = Number(item.temperatura_max) >= 35;
                  const isCold = Number(item.temperatura_min) <= 0;
                  const renderTipo = () => {
                    if (isHot) return <span className="tipo-badge hot"><ThermometerSun size={12}/> Calor</span>;
                    if (isCold) return <span className="tipo-badge cold"><Snowflake size={12}/> Frio</span>;
                    return '—';
                  };

                  return (
                    <tr key={item.id_clima}>
                      <td>{renderTipo()}</td>
                      <td>{item.data_completa ?? '—'}</td>
                      <td><span className="pais-badge">{item.pais ?? '—'}</span></td>
                      <td><span className="continente-badge">{item.continente ?? '—'}</span></td>
                      <td>{(item.pais === 'Brasil' && !item.municipio?.startsWith('Grid')) ? item.municipio : <span style={{color:'#666'}}>{item.pais}</span>}</td>
                      <td className="td-num">{Number(item.latitude).toFixed(4)}</td>
                      <td className="td-num">{Number(item.longitude).toFixed(4)}</td>
                      <td className="td-num" style={{ color: isHot ? '#ef4444' : 'inherit', fontWeight: isHot ? 600 : 400 }}>
                        {item.temperatura_max ? `${Number(item.temperatura_max).toFixed(1)}°C` : '—'}
                      </td>
                      <td className="td-num" style={{ color: isCold ? '#3b82f6' : 'inherit', fontWeight: isCold ? 600 : 400 }}>
                        {item.temperatura_min ? `${Number(item.temperatura_min).toFixed(1)}°C` : '—'}
                      </td>
                      <td className="td-num">{item.precipitacao_mm ?? '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {!loading && data.length > 0 && (
          <div className="focos-pagination">
            <button
              className="pagination-btn"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <span className="pagination-info">Página {currentPage}</span>
            <button
              className="pagination-btn"
              disabled={data.length < PAGE_SIZE}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
