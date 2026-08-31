/**
 * Camada de integração com o backend de pontuação.
 *
 * Por enquanto simula a rede com dados mockados em memória, mas a
 * ASSINATURA das funções já é a definitiva: `fetchLeaderboard()`
 * retorna uma Promise com os top 5, e `saveScore(playerName, score)`
 * retorna uma Promise que resolve quando o score foi salvo.
 *
 * Quando o backend (Node/Express/Sequelize) estiver pronto, troque
 * apenas o CORPO destas duas funções por chamadas `fetch('/api/scores...')`
 * — nenhum outro arquivo do jogo precisa mudar, pois Game.js e
 * MenuScreen.js só conhecem esta interface.
 *
 * Sugestão de contrato REST para quando a integração acontecer:
 *   GET  /api/scores/top      -> [{ playerName, score }, ...] (5 primeiros)
 *   POST /api/scores          -> body { playerName, score }   -> 201 Created
 */

const SIMULATED_LATENCY_MS = 350;

let mockLeaderboard = [
  { playerName: 'Ana', score: 1850 },
  { playerName: 'Bruno', score: 1620 },
  { playerName: 'Carla', score: 1400 },
  { playerName: 'Diego', score: 1150 },
  { playerName: 'Eva', score: 900 },
];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const ScoreService = {
  /** Busca as 5 maiores pontuações. Hoje: mock local. Depois: GET /api/scores/top. */
  async fetchLeaderboard() {
    await delay(SIMULATED_LATENCY_MS);
    return [...mockLeaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  },

  /**
   * Salva o resultado de uma partida. Disparada automaticamente ao
   * final de cada rodada (incluindo em "Tentar novamente").
   * Hoje: mock local. Depois: POST /api/scores.
   */
  async saveScore(playerName, score) {
    console.log(`[ScoreService] Salvando score: ${playerName} = ${score}`);
    await delay(SIMULATED_LATENCY_MS);

    mockLeaderboard.push({ playerName, score });
    mockLeaderboard = mockLeaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // mantém só um histórico razoável em memória

    return { playerName, score, savedAt: new Date().toISOString() };
  },
};
