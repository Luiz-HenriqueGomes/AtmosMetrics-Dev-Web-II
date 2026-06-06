import { useEffect, useState } from 'react';
import { Flame, MapPin, Satellite, BarChart3, AlertCircle, Thermometer, Wind } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import StatCard from '../components/StatCard';
import { api, type ResumoResponse, type AnomaliaItem, type ResumoClimaResponse, type ResumoQualidadeArResponse } from '../services/api';
import './DashboardPage.css';

// ---- Tooltip customizado para o Recharts (focos) ----
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        fontSize: '12px',
        color: 'var(--text-primary)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontWeight: 700, color: '#f97316' }}>
          {payload[0].value?.toLocaleString('pt-BR')} focos
        </p>
      </div>
    );
  }
  return null;
};

// ---- Tooltip customizado para gráficos de temperatura ----
const TempTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        fontSize: '12px',
        color: 'var(--text-primary)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontWeight: 700, color: '#3b82f6' }}>
          {Number(payload[0].value).toFixed(1)}°C
        </p>
      </div>
    );
  }
  return null;
};

// ---- Tooltip customizado para gráficos de qualidade do ar ----
const AqiTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const aqi = Number(payload[0].value);
    const color = aqi <= 50 ? '#10b981' : aqi <= 100 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        padding: '0.6rem 1rem',
        fontSize: '12px',
        color: 'var(--text-primary)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontWeight: 700, color }}>
          AQI: {aqi.toFixed(0)}
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const [resumo, setResumo] = useState<ResumoResponse | null>(null);
  const [anomalias, setAnomalias] = useState<AnomaliaItem[]>([]);
  const [resumoClima, setResumoClima] = useState<ResumoClimaResponse | null>(null);
  const [resumoAr, setResumoAr] = useState<ResumoQualidadeArResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Carrega todas as fontes de dados independentemente (uma falha não bloqueia as outras)
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // Dados de focos (INPE / NASA FIRMS)
      try {
        const [res, anom] = await Promise.all([
          api.getResumo(),
          api.getAnomalias({ limit: 200 }),
        ]);
        setResumo(res);
        setAnomalias(anom);
      } catch {
        setError('Não foi possível carregar os dados de focos. Verifique se o backend está online.');
      }

      // Dados de clima (Open-Meteo) — falha silenciosa
      try {
        const clima = await api.getResumoClima();
        setResumoClima(clima);
      } catch {
        // API de clima pode não estar configurada ainda
      }

      // Dados de qualidade do ar (OpenWeatherMap) — falha silenciosa
      try {
        const ar = await api.getResumoQualidadeAr();
        setResumoAr(ar);
      } catch {
        // API de qualidade do ar pode não estar configurada ainda
      }

      setLoading(false);
    };

    loadData();
  }, []);

  // Deriva os dados para os cards e gráficos a partir da estrutura real da API
  const porUF    = resumo?.por_uf    ?? [];
  const porBioma = resumo?.por_bioma ?? [];

  const estadosAfetados  = porUF.length;
  const biomaMaisAfetado = porBioma[0]?.chave ?? '—';

  // Formata para o Recharts
  const dadosBioma = porBioma.map(b => ({ bioma: b.chave, total: b.total_focos }));
  const topUF      = porUF.slice(0, 7);
  const maxUF      = topUF[0]?.total_focos ?? 1;

  // Dados de temperatura por continente para o gráfico
  const dadosTempContinente = (resumoClima?.por_continente ?? []).map(c => ({
    continente: c.continente,
    temp_media: parseFloat(c.temp_media) || 0,
  }));

  // Dados de qualidade do ar por continente para o gráfico
  const dadosArContinente = (resumoAr?.por_continente ?? []).map(c => ({
    continente: c.continente,
    aqi_medio: parseFloat(c.aqi_medio) || 0,
  }));

  // Determina cor do AQI para o card
  const aqiValue = resumoAr?.aqi_medio ? parseFloat(resumoAr.aqi_medio) : null;
  const aqiColor = aqiValue !== null
    ? aqiValue <= 50 ? 'var(--green)' : aqiValue <= 100 ? '#f59e0b' : '#ef4444'
    : 'var(--text-muted)';

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Monitoramento Global</h1>
          <p className="dashboard-subtitle">
            Focos de calor, clima e qualidade do ar — Fontes: INPE, NASA FIRMS, Open-Meteo, OpenWeatherMap
          </p>
        </div>
        <div className="dashboard-badge">
          <span className="badge-dot" />
          Dados em tempo real
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stat Cards — 6 cards: 4 originais + 2 novos */}
      <div className="stat-grid">
        <StatCard
          label="Total de Focos"
          value={resumo?.total_focos ?? 0}
          sub="🔥 Todos os registros no banco de dados"
          icon={Flame}
          accent="var(--fire)"
          iconBg="rgba(249,115,22,0.12)"
          loading={loading}
        />
        <StatCard
          label="Estados Afetados"
          value={estadosAfetados}
          sub={`📍 de 27 Unidades Federativas`}
          icon={MapPin}
          accent="var(--accent)"
          iconBg="rgba(59,130,246,0.12)"
          loading={loading}
        />
        <StatCard
          label="Bioma + Afetado"
          value={biomaMaisAfetado}
          sub={`🌿 ${porBioma[0]?.total_focos?.toLocaleString('pt-BR') ?? '—'} focos registrados`}
          icon={BarChart3}
          accent="var(--green)"
          iconBg="rgba(16,185,129,0.12)"
          loading={loading}
        />
        <StatCard
          label="FRP Médio"
          value={resumo?.media_frp ? `${parseFloat(resumo.media_frp).toFixed(1)} MW` : '—'}
          sub="🛰️ Potência Radiativa do Fogo"
          icon={Satellite}
          accent="#a78bfa"
          iconBg="rgba(167,139,250,0.12)"
          loading={loading}
        />
        <StatCard
          label="Temp. Média Global"
          value={resumoClima?.temperatura_media_global ? `${parseFloat(resumoClima.temperatura_media_global).toFixed(1)}°C` : 'Indisponível'}
          sub={resumoClima ? `🌡️ Min: ${parseFloat(resumoClima.temperatura_min_global ?? '0').toFixed(1)}°C · Max: ${parseFloat(resumoClima.temperatura_max_global ?? '0').toFixed(1)}°C` : '🌡️ Execute o ETL de Clima'}
          icon={Thermometer}
          accent="#3b82f6"
          iconBg="rgba(59,130,246,0.12)"
          loading={loading}
        />
        <StatCard
          label="Qualidade do Ar"
          value={aqiValue !== null ? `AQI ${aqiValue.toFixed(0)}` : 'Indisponível'}
          sub={resumoAr ? `💨 ${resumoAr.total_registros} registros · PM2.5: ${resumoAr.pm25_medio ?? '—'}` : '💨 Execute o ETL de Qualidade do Ar'}
          icon={Wind}
          accent={aqiColor}
          iconBg={aqiValue !== null && aqiValue <= 50 ? 'rgba(16,185,129,0.12)' : aqiValue !== null && aqiValue <= 100 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)'}
          loading={loading}
        />
      </div>

      {/* Mapa Interativo — Visão Global */}
      <div className="panel" style={{ height: '400px', padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Carregando mapa...
          </div>
        ) : (
          <MapContainer 
            preferCanvas={true}
            center={[20, 0]} 
            zoom={2} 
            minZoom={2}
            maxBounds={[[-90, -180], [90, 180]]}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', zIndex: 0, background: 'var(--bg-surface)' }}
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              className="map-tiles-dark-overlay"
              noWrap={true}
            />
            {anomalias.map(foco => {
              if (!foco.latitude || !foco.longitude) return null;
              const isHighRisk = parseFloat(foco.risco_fogo || '0') > 0.8;
              const color = isHighRisk ? '#ef4444' : '#f97316';
              return (
                <CircleMarker
                  key={foco.id_anomalia}
                  center={[parseFloat(foco.latitude), parseFloat(foco.longitude)]}
                  radius={isHighRisk ? 8 : 5}
                  pathOptions={{ 
                    color: '#ffffff',
                    opacity: 0.6,
                    fillColor: color, 
                    fillOpacity: 0.9, 
                    weight: 1.5
                  }}
                >
                  <Popup>
                    <div style={{ color: '#333' }}>
                      <strong>{foco.municipio}{foco.uf ? ` - ${foco.uf}` : ''}{foco.pais ? ` · ${foco.pais}` : ''}</strong><br/>
                      FRP: {foco.frp_megawatts} MW<br/>
                      Risco: {foco.risco_fogo}<br/>
                      Data: {foco.data_completa}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Gráficos — Grid 2x2 */}
      <div className="charts-grid">
        {/* Gráfico de barras — focos por bioma */}
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={14} />
            Focos por Bioma
          </div>
          {loading ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Carregando dados...
            </div>
          ) : dadosBioma.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Execute o ETL para popular o banco com dados do INPE
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosBioma} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="bioma" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {dadosBioma.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#f97316' : `rgba(249,115,22,${Math.max(0.3, 0.8 - i * 0.12)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de barras — top estados */}
        <div className="panel">
          <div className="panel-title">
            <BarChart3 size={14} />
            Top Estados (Focos)
          </div>
          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Carregando dados...
            </div>
          ) : topUF.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Execute o ETL para popular o banco com dados do INPE
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topUF} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="chave" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total_focos" radius={[0, 4, 4, 0]}>
                  {topUF.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#3b82f6' : `rgba(59,130,246,${Math.max(0.3, 0.9 - i * 0.1)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico — Temperatura por Continente */}
        <div className="panel">
          <div className="panel-title">
            <Thermometer size={14} />
            Temperatura por Continente
          </div>
          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Carregando dados...
            </div>
          ) : dadosTempContinente.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Dados indisponíveis — Execute o ETL de Clima (Open-Meteo)
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosTempContinente} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} unit="°C" />
                <YAxis dataKey="continente" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<TempTooltip />} />
                <Bar dataKey="temp_media" radius={[0, 4, 4, 0]}>
                  {dadosTempContinente.map((d, i) => {
                    // Gradiente: azul para frio, vermelho para quente
                    const temp = d.temp_media;
                    const color = temp <= 0 ? '#3b82f6' : temp <= 15 ? '#06b6d4' : temp <= 25 ? '#f59e0b' : '#ef4444';
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico — Qualidade do Ar por Continente */}
        <div className="panel">
          <div className="panel-title">
            <Wind size={14} />
            Qualidade do Ar por Continente
          </div>
          {loading ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Carregando dados...
            </div>
          ) : dadosArContinente.length === 0 ? (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
              Dados indisponíveis — Execute o ETL de Qualidade do Ar (OpenWeather)
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dadosArContinente} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="continente" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<AqiTooltip />} />
                <Bar dataKey="aqi_medio" radius={[0, 4, 4, 0]}>
                  {dadosArContinente.map((d, i) => {
                    // Verde para bom, amarelo para moderado, vermelho para ruim
                    const aqi = d.aqi_medio;
                    const color = aqi <= 50 ? '#10b981' : aqi <= 100 ? '#f59e0b' : '#ef4444';
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Ranking de Estados */}
      <div className="panel">
        <div className="panel-title">
          <Flame size={14} />
          Ranking Completo por Estado
        </div>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Carregando...</p>
        ) : topUF.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Nenhum dado disponível. Execute o ETL primeiro.
          </p>
        ) : (
          <div className="rank-list">
            {topUF.map((item, i) => (
              <div className="rank-item" key={item.chave}>
                <span className="rank-pos">#{i + 1}</span>
                <span className="rank-label">{item.chave}</span>
                <div className="rank-bar-wrap">
                  <div
                    className="rank-bar-fill"
                    style={{ width: `${(item.total_focos / maxUF) * 100}%` }}
                  />
                </div>
                <span className="rank-value">{item.total_focos.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
