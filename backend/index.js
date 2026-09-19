import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize, { testConnection } from './src/config/database.js';
import scoreRoutes from './src/routes/scoreRoutes.js';
import errorHandler from './src/middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem "origin" (ex: curl, Postman, apps mobile nativos)
    // Se quiser bloquear isso também, troque para callback(new Error('Não permitido por CORS')).
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Não permitido por CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/scores', scoreRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use(errorHandler);

const start = async () => {
  try {
    await testConnection();
    await sequelize.sync(); // usar migrations em produção, sync() apenas para desenvolvimento
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

start();
