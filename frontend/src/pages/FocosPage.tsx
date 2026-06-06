import { useEffect, useState } from 'react';
import { Thermometer, ChevronLeft, ChevronRight, Filter, X, Download } from 'lucide-react';
import { api, type AnomaliaItem, type AnomaliaFilters, type EstadoOut, type BiomaOut, type PaisOut, type ContinenteOut } from '../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import './FocosPage.css';

const PAGE_SIZE = 100;

export default function FocosPage() {
  const [data, setData] = useState<AnomaliaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros
  const [uf, setUf] = useState('');
  const [bioma, setBioma] = useState('');
  const [satelite, setSatelite] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [continente, setContinente] = useState('');
  const [pais, setPais] = useState('');

  // Opções para selects
  const [estados, setEstados] = useState<EstadoOut[]>([]);
  const [biomas, setBiomas] = useState<BiomaOut[]>([]);
  const [paises, setPaises] = useState<PaisOut[]>([]);
  const [continentes, setContinentes] = useState<ContinenteOut[]>([]);

  // Carrega opções de filtro ao montar
  useEffect(() => {
    api.getEstados().then(setEstados).catch(() => {});
    api.getBiomas().then(setBiomas).catch(() => {});
    api.getPaises().then(setPaises).catch(() => {});
    api.getContinentes().then(setContinentes).catch(() => {});
  }, []);

  // Países filtrados pelo continente selecionado
  const paisesFiltrados = continente
    ? paises.filter(p => p.continente === continente)
    : paises;

  // Mostra UF/Bioma somente quando o país é Brasil (ou sem filtro de país)
  const mostrarFiltrosBrasil = !pais || pais === 'Brasil';

  // Carrega dados quando filtros ou offset mudam
  useEffect(() => {
    setLoading(true);
    setError(null);

    const filters: AnomaliaFilters = {
      limit: PAGE_SIZE,
      offset,
      ...(uf && { uf }),
      ...(bioma && { bioma }),
      ...(satelite && { satelite }),
      ...(dataInicio && { data_inicio: dataInicio }),
      ...(dataFim && { data_fim: dataFim }),
      ...(pais && { pais }),
      ...(continente && { continente }),
    };

    api.getAnomalias(filters)
      .then(setData)
      .catch(() => setError('Não foi possível carregar os focos de temperaturas extremas.'))
      .finally(() => setLoading(false));
  }, [offset, uf, bioma, satelite, dataInicio, dataFim, pais, continente]);

  const handleFilter = () => {
    setOffset(0); // Reset para página 1 ao filtrar
  };

  const clearFilters = () => {
    setUf('');
    setBioma('');
    setSatelite('');
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
      item.uf ?? '-',
      item.municipio ?? '-',
      item.bioma ?? '-',
      item.nome_satelite ?? '-',
      item.frp_megawatts ? Number(item.frp_megawatts).toFixed(1) : '-',
      item.risco_fogo ? Number(item.risco_fogo).toFixed(2) : '-'
    ]);

    autoTable(doc, {
      head: [['Data', 'País', 'Continente', 'UF', 'Município', 'Bioma', 'Satélite', 'FRP (MW)', 'Risco']],
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
      Hora: item.hora_utc,
      Pais: item.pais,
      Continente: item.continente,
      UF: item.uf,
      Municipio: item.municipio,
      Bioma: item.bioma,
      Satelite: item.nome_satelite,
      Latitude: item.latitude,
      Longitude: item.longitude,
      FRP: item.frp_megawatts,
      Risco: item.risco_fogo
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'atmosmetrics_temperaturas_extremas.csv';
    link.click();
  };

  const hasActiveFilters = uf || bioma || satelite || dataInicio || dataFim || pais || continente;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="focos-page">
      {/* Header */}
      <div className="focos-header">
        <div>
          <h1 className="focos-title">Focos de Temperaturas Extremas</h1>
          <p className="focos-subtitle">
            Registro detalhado de anomalias térmicas detectadas por satélite — Dados globais
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
            {/* Filtros globais — sempre visíveis */}
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

            {/* Filtros brasileiros — visíveis apenas quando país é Brasil ou nenhum */}
            {mostrarFiltrosBrasil && (
              <>
                <div className="filter-group">
                  <label className="filter-label">Estado (UF)</label>
                  <select className="filter-input" value={uf} onChange={e => { setUf(e.target.value); handleFilter(); }}>
                    <option value="">Todos</option>
                    {estados.map(e => (
                      <option key={e.uf} value={e.uf}>{e.uf} — {e.estado}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Bioma</label>
                  <select className="filter-input" value={bioma} onChange={e => { setBioma(e.target.value); handleFilter(); }}>
                    <option value="">Todos</option>
                    {biomas.map(b => (
                      <option key={b.bioma} value={b.bioma}>{b.bioma}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="filter-group">
              <label className="filter-label">Satélite</label>
              <input
                className="filter-input"
                type="text"
                placeholder="Ex: AQUA_M-T"
                value={satelite}
                onChange={e => setSatelite(e.target.value)}
                onBlur={handleFilter}
                onKeyDown={e => e.key === 'Enter' && handleFilter()}
              />
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
                <th>Data</th>
                <th>Hora</th>
                <th>País</th>
                <th>Continente</th>
                <th>UF</th>
                <th>Município</th>
                <th>Bioma</th>
                <th>Satélite</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>FRP (MW)</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j}><div className="skeleton-cell" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={12} className="focos-empty">
                    <Thermometer size={20} />
                    <span>Nenhum foco encontrado. {hasActiveFilters ? 'Tente ajustar os filtros.' : 'Execute o ETL para popular o banco.'}</span>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id_anomalia}>
                    <td>{item.data_completa ?? '—'}</td>
                    <td>{item.hora_utc ?? '—'}</td>
                    <td><span className="pais-badge">{item.pais ?? '—'}</span></td>
                    <td><span className="continente-badge">{item.continente ?? '—'}</span></td>
                    <td><span className="uf-badge">{item.uf ?? '—'}</span></td>
                    <td>{item.municipio ?? '—'}</td>
                    <td>{item.bioma ?? '—'}</td>
                    <td className="td-satelite">{item.nome_satelite ?? '—'}</td>
                    <td className="td-num">{Number(item.latitude).toFixed(4)}</td>
                    <td className="td-num">{Number(item.longitude).toFixed(4)}</td>
                    <td className="td-num td-frp">{item.frp_megawatts ? Number(item.frp_megawatts).toFixed(1) : '—'}</td>
                    <td className="td-num">{item.risco_fogo ? Number(item.risco_fogo).toFixed(2) : '—'}</td>
                  </tr>
                ))
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
