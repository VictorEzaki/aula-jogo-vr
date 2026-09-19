import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class PlayerScore extends Model {}

PlayerScore.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    playerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'player_name',
      validate: {
        notEmpty: { msg: 'O nome do jogador não pode ser vazio.' },
        len: {
          args: [1, 50],
          msg: 'O nome do jogador deve ter entre 1 e 50 caracteres.',
        },
      },
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isInt: { msg: 'A pontuação deve ser um número inteiro.' },
      },
    },
  },
  {
    sequelize,
    modelName: 'PlayerScore',
    tableName: 'player_scores',
    indexes: [
      {
        name: 'idx_player_scores_score',
        fields: [['score', 'DESC']],
      },
    ],
  }
);

export default PlayerScore;
