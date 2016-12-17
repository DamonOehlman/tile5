// @flow

import type { PosRecord } from 'geojs/src/core/position.js';

const
  PANSPEED_THRESHOLD_REFRESH = 0,
  PANSPEED_THRESHOLD_FASTPAN = 2,
  PADDING_AUTO = 'auto';

import { TileLoader } from '../tile.js';

type ViewOptionsRecord = {
  viewport: HTMLCanvasElement,
  loader: TileLoader
};

export class View {
  // TODO (djo): work out how to make this "final"
  viewport: HTMLCanvasElement;
  loader: TileLoader;

  constructor(options: ViewOptionsRecord) {
    this.viewport = options.viewport;
    this.loader = options.loader;
  }

  centerOnPosition(position: PosRecord) {
    console.log(position.lat);
  }
}
