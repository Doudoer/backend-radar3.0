import type { ErrorRequestHandler } from 'express';

const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Error interno del servidor',
  });
};

export default errorMiddleware;
