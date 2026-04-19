// ============================================================
// AtmosMetrics — API Service
// Camada de comunicação com o backend FastAPI em localhost:8000
// ============================================================

const BASE_URL = 'http://localhost:8000/api/v1';

// Estrutura real retornada pelo endpoint /api/v1/anomalias/resumo
export interface ResumoItem {
  chave: string;
  total_focos: number;
  frp_media?: string;
  frp_max?: string;
}

export interface ResumoResponse {
  total_focos: number;
  media_frp?: string;
  media_risco?: string;
  data_inicio?: string;
  data_fim?: string;
  por_uf: ResumoItem[];
  por_bioma: ResumoItem[];

  // Campos derivados calculados no frontend
  estados_afetados?: number;
  bioma_mais_afetado?: string;
  satelite_mais_ativo?: string;
  focos_por_bioma?: { bioma: string; total: number }[];
  focos_por_uf?: { uf: string; total: number }[];
  focos_por_mes?: { mes: string; total: number }[];
}

export interface Localidade {
  id_localidade: number;
  uf: string;
  estado: string;
  regiao: string;
  bioma: string;
}

export interface Satelite {
  id_satelite: number;
  nome: string;
  ativo: boolean;
}

export interface HealthResponse {
  status: string;
  api: string;
  versao: string;
  banco: string;
}

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getResumo: () => fetchAPI<ResumoResponse>('/anomalias/resumo'),
  getLocalidades: () => fetchAPI<Localidade[]>('/localidades/'),
  getEstados: () => fetchAPI<{ uf: string; estado: string }[]>('/localidades/estados'),
  getBiomas: () => fetchAPI<{ bioma: string }[]>('/localidades/biomas'),
  getSatelites: () => fetchAPI<Satelite[]>('/satelites/'),
  getHealth: () => fetch('http://localhost:8000/').then(r => r.json() as Promise<HealthResponse>),
};
