import PlayerScore from '../models/PlayerScore.js';

const TOP_SCORES_LIMIT = 10;
const MAX_PLAYER_NAME_LENGTH = 50;

class ScoreServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'ScoreServiceError';
    this.statusCode = statusCode;
  }
}

/**
 * Retorna o ranking dos melhores jogadores, ordenado por pontuação decrescente.
 * @param {number} [limit=TOP_SCORES_LIMIT]
 * @returns {Promise<Array<{id: number, playerName: string, score: number, createdAt: Date}>>}
 */
const fetchLeaderboard = async (limit = TOP_SCORES_LIMIT) => {
  const scores = await PlayerScore.findAll({
    order: [['score', 'DESC']],
    limit,
    attributes: ['id', 'playerName', 'score', 'createdAt'],
  });

  return scores;
};

/**
 * Persiste uma nova pontuação após validar os dados de entrada.
 * @param {string} playerName
 * @param {number} score
 * @returns {Promise<PlayerScore>}
 */
const saveScore = async (playerName, score) => {
  if (typeof playerName !== 'string' || playerName.trim().length === 0) {
    throw new ScoreServiceError('O nome do jogador é obrigatório.');
  }

  if (playerName.trim().length > MAX_PLAYER_NAME_LENGTH) {
    throw new ScoreServiceError(
      `O nome do jogador deve ter no máximo ${MAX_PLAYER_NAME_LENGTH} caracteres.`
    );
  }

  const parsedScore = Number(score);

  if (!Number.isInteger(parsedScore)) {
    throw new ScoreServiceError('A pontuação deve ser um número inteiro.');
  }

  const newScore = await PlayerScore.create({
    playerName: playerName.trim(),
    score: parsedScore,
  });

  return newScore;
};

/**
 * Atualiza o score de um jogador apenas se o novo valor for maior que o existente.
 * Se o jogador ainda não tiver registro, cria um novo.
 * @param {number} id
 * @param {number} score
 * @returns {Promise<PlayerScore>}
 */
const updateScoreIfHigher = async (id, score) => {
  const parsedScore = Number(score);

  if (!Number.isInteger(parsedScore)) {
    throw new ScoreServiceError('A pontuação deve ser um número inteiro.');
  }

  const existing = await PlayerScore.findByPk(id);

  if (!existing) {
    throw new ScoreServiceError('Registro de pontuação não encontrado.', 404);
  }

  if (parsedScore <= existing.score) {
    return existing; // mantém o score atual, não é uma pontuação melhor
  }

  existing.score = parsedScore;
  await existing.save();

  return existing;
};

export { ScoreServiceError, TOP_SCORES_LIMIT };
export default { fetchLeaderboard, saveScore, updateScoreIfHigher };
