import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
});

export function logRequest(req: Request, duration: number, status: number) {
  logger.info({
    method: req.method,
    url: req.url,
    status,
    duration,
    ip: req.headers.get('x-forwarded-for'),
  });
}
