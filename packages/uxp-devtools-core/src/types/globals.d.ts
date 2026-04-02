/*
 * Global type declarations
 */

import type { Logger } from '../core/common/Logger.js';

declare global {
  // eslint-disable-next-line vars-on-top
  var UxpLogger: Logger;
}

export {};
