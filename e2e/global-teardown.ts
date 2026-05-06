import type { Server } from 'node:http';
import { stopStubBackend } from './utils/stub-backend';

export default async function globalTeardown() {
  const server = (globalThis as Record<string, unknown>).__stubBackend as Server | undefined;
  if (server) {
    await stopStubBackend(server);
  }
}
