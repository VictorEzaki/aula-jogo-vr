'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('player_scores', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      player_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('player_scores', {
      name: 'idx_player_scores_score',
      fields: [{ attribute: 'score', order: 'DESC' }],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('player_scores', 'idx_player_scores_score');
    await queryInterface.dropTable('player_scores');
  },
};