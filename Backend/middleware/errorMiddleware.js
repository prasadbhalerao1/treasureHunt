const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(err.stack);

  res.status(statusCode).json({
    msg: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export { errorHandler };
