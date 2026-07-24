import { Rectangle } from '@/types';

/**
 * Spatial grid for efficient collision detection
 * Divides the game world into a grid to quickly find nearby objects
 */
export class SpatialGrid<T extends { bounds: Rectangle }> {
  private grid: Map<string, T[]> = new Map();
  private cellSize: number;
  private worldWidth: number;
  private worldHeight: number;

  constructor(cellSize: number, worldWidth: number, worldHeight: number) {
    this.cellSize = cellSize;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  /**
   * Convert world coordinates to grid coordinates
   */
  private worldToGrid(x: number, y: number): { gridX: number; gridY: number } {
    return {
      gridX: Math.floor(x / this.cellSize),
      gridY: Math.floor(y / this.cellSize)
    };
  }

  /**
   * Generate a key for a grid cell
   */
  private getCellKey(gridX: number, gridY: number): string {
    return `${gridX},${gridY}`;
  }

  /**
   * Get all grid cells that an object's bounds intersect
   */
  private getIntersectingCells(bounds: Rectangle): string[] {
    const topLeft = this.worldToGrid(bounds.x, bounds.y);
    const bottomRight = this.worldToGrid(
      bounds.x + bounds.width,
      bounds.y + bounds.height
    );

    const cells: string[] = [];
    for (let x = topLeft.gridX; x <= bottomRight.gridX; x++) {
      for (let y = topLeft.gridY; y <= bottomRight.gridY; y++) {
        cells.push(this.getCellKey(x, y));
      }
    }
    return cells;
  }

  /**
   * Add an object to the spatial grid
   */
  insert(object: T): void {
    const cells = this.getIntersectingCells(object.bounds);
    
    for (const cellKey of cells) {
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, []);
      }
      this.grid.get(cellKey)!.push(object);
    }
  }

  /**
   * Remove an object from the spatial grid
   */
  remove(object: T): void {
    const cells = this.getIntersectingCells(object.bounds);
    
    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        const index = cell.indexOf(object);
        if (index !== -1) {
          cell.splice(index, 1);
        }
        
        // Remove empty cells to save memory
        if (cell.length === 0) {
          this.grid.delete(cellKey);
        }
      }
    }
  }

  /**
   * Get all objects that could potentially collide with the given bounds
   */
  query(bounds: Rectangle): T[] {
    const cells = this.getIntersectingCells(bounds);
    const results = new Set<T>(); // Use Set to avoid duplicates
    
    for (const cellKey of cells) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        for (const object of cell) {
          results.add(object);
        }
      }
    }
    
    return Array.from(results);
  }

  /**
   * Clear the entire grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Get statistics about the grid
   */
  getStats(): {
    totalCells: number;
    occupiedCells: number;
    totalObjects: number;
    averageObjectsPerCell: number;
  } {
    const occupiedCells = this.grid.size;
    let totalObjects = 0;
    
    for (const cell of this.grid.values()) {
      totalObjects += cell.length;
    }
    
    return {
      totalCells: Math.ceil(this.worldWidth / this.cellSize) * Math.ceil(this.worldHeight / this.cellSize),
      occupiedCells,
      totalObjects,
      averageObjectsPerCell: occupiedCells > 0 ? totalObjects / occupiedCells : 0
    };
  }
}