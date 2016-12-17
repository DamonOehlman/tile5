// @flow

export type Tile = {
  x: number,
  y: number,
  zoom: number,
  img: HTMLImageElement
};

export class TileLoader {
  constructor() {

  }

  loadTile(x: number, y: number, zoom: number): Promise<Tile> {
    // functionality need to be overridem by subtype loaders
    return Promise.reject(new Error('not implemented'));
  }
}
