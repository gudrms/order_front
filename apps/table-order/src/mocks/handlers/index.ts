/**
 * MSW Handlers - 모든 API handlers 통합
 */

import { menusHandlers } from './menus';
import { ordersHandlers } from './orders';
import { storesHandlers } from './stores';
import { sessionsHandlers } from './sessions';

export const handlers = [
  ...menusHandlers,
  ...ordersHandlers,
  ...storesHandlers,
  ...sessionsHandlers,
];
