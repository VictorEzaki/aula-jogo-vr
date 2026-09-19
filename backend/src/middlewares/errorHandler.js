/**
 * Middleware global de tratamento de erros.
 * Deve ser registrado por último, após todas as rotas.
 */
const errorHandler = (err, req, res, next) => {
  console.error('Erro não tratado:', err);

  if (err.message === 'Não permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origem não autorizada.',
    });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: err.errors?.map((e) => e.message).join(', ') || 'Erro de validação.',
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor.',
  });
};

export default errorHandler;
