import { createMiddleware } from './middleware';

export const passThrough = createMiddleware(
  () => 'passThrough',
  innerPipe => innerPipe,
);
