import scoreService, { ScoreServiceError } from '../services/scoreService.js';

/**
 * GET /api/scores/top
 */
const getTopScores = async (req, res, next) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const leaderboard = await scoreService.fetchLeaderboard(limit);

    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/scores
 */
const createScore = async (req, res, next) => {
  try {
    const { playerName, score } = req.body;

    const newScore = await scoreService.saveScore(playerName, score);

    return res.status(201).json({
      success: true,
      data: newScore,
    });
  } catch (error) {
    if (error instanceof ScoreServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

/**
 * PUT /api/scores/:id
 */
const updateScore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { score } = req.body;

    const updated = await scoreService.updateScoreIfHigher(id, score);

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    if (error instanceof ScoreServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

export default { getTopScores, createScore, updateScore };
