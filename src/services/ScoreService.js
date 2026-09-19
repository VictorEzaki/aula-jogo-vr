/**
 * Camada de integração com o backend de pontuação (Node/Express/Sequelize).
 *
 * Contrato REST:
 *   GET  /api/scores/top?limit=5   -> [{ id, playerName, score, createdAt }, ...]
 *   POST /api/scores               -> body { playerName, score } -> 201, cria registro
 *   PUT  /api/scores/:id           -> body { score } -> 200, atualiza (só se score for maior)
 */

// Sem bundler neste projeto (Three.js é carregado via importmap direto do
// navegador — ver index.html), então não existe `import.meta.env`. A URL
// do backend fica como constante simples, no mesmo padrão dos outros
// tunables do projeto (topo do arquivo, fácil de trocar por ambiente).
const API_BASE_URL = 'http://localhost:3000';

async function parseResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || fallbackMessage);
  }

  return body.data;
}

export const ScoreService = {
  /** Busca as 5 maiores pontuações no backend. */
  async fetchLeaderboard() {
    const response = await fetch(`${API_BASE_URL}/api/scores/top?limit=5`);
    return parseResponse(response, 'Falha ao buscar o ranking.');
  },

  /**
   * Cria um novo registro de pontuação. Usado apenas na PRIMEIRA partida
   * de uma sessão (ver Game.js: _handlePlay reseta _currentScoreId).
   * Retorna o registro criado, incluindo o `id` (necessário para updateScore).
   */
  async saveScore(playerName, score) {
    const response = await fetch(`${API_BASE_URL}/api/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, score }),
    });
    return parseResponse(response, 'Falha ao salvar a pontuação.');
  },

  /**
   * Atualiza a pontuação de um registro já existente. Usado em
   * "Tentar novamente" (ver Game.js: _handleRetry mantém _currentScoreId).
   */
  async updateScore(id, score) {
    const response = await fetch(`${API_BASE_URL}/api/scores/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    });
    return parseResponse(response, 'Falha ao atualizar a pontuação.');
  },
};