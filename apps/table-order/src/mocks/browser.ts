/**
 * MSW Browser Setup
 * 브라우저 환경에서 MSW 활성화
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
