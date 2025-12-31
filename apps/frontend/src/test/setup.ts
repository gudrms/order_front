/**
 * Vitest 테스트 환경 설정
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Testing Library matchers 확장
expect.extend(matchers);

// 각 테스트 후 자동 cleanup
afterEach(() => {
  cleanup();
});
