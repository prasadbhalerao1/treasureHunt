const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
    if (err) console.error(err);
  },
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  http: (req) => {
    console.log(
      `[HTTP] ${new Date().toISOString()} ${req.method} ${req.url} - IP: ${req.ip}`,
    );
  },
};

export default logger;
