/**
 * Spatial Optimization Utilities
 * Provides viewport culling and spatial partitioning for performance optimization
 */

export interface Viewport {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface SpatialBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialPoint {
  x: number;
  y: number;
  size?: number;
}

/**
 * Check if a point is within the viewport bounds
 */
export function isPointInViewport(point: SpatialPoint, viewport: Viewport): boolean {
  const margin = point.size || 5; // Add margin for dot size
  return (
    point.x + margin >= viewport.left &&
    point.x - margin <= viewport.right &&
    point.y + margin >= viewport.top &&
    point.y - margin <= viewport.bottom
  );
}

/**
 * Check if a circular area intersects with the viewport
 */
export function isCircleInViewport(
  x: number,
  y: number,
  radius: number,
  viewport: Viewport
): boolean {
  return (
    x + radius >= viewport.left &&
    x - radius <= viewport.right &&
    y + radius >= viewport.top &&
    y - radius <= viewport.bottom
  );
}

/**
 * Get current viewport bounds
 */
export function getViewport(canvas: HTMLCanvasElement): Viewport {
  const rect = canvas.getBoundingClientRect();
  return {
    left: 0,
    top: 0,
    right: canvas.width,
    bottom: canvas.height,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Calculate distance from point to viewport center
 */
export function distanceToViewportCenter(point: SpatialPoint, viewport: Viewport): number {
  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const dx = point.x - centerX;
  const dy = point.y - centerY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Level of Detail calculation based on distance
 */
export function calculateLOD(distance: number, maxDistance: number): number {
  const normalizedDistance = Math.min(distance / maxDistance, 1);
  
  if (normalizedDistance < 0.3) return 1.0; // High detail
  if (normalizedDistance < 0.6) return 0.7; // Medium detail
  if (normalizedDistance < 0.8) return 0.4; // Low detail
  return 0.1; // Very low detail
}

/**
 * Spatial Grid for efficient spatial queries
 */
export class SpatialGrid {
  private grid: Map<string, SpatialPoint[]> = new Map();
  private cellSize: number;
  private bounds: SpatialBounds;

  constructor(bounds: SpatialBounds, cellSize: number = 100) {
    this.bounds = bounds;
    this.cellSize = cellSize;
  }

  /**
   * Get grid cell key for a point
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Add point to the spatial grid
   */
  addPoint(point: SpatialPoint): void {
    const key = this.getCellKey(point.x, point.y);
    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }
    this.grid.get(key)!.push(point);
  }

  /**
   * Get all points in a viewport
   */
  getPointsInViewport(viewport: Viewport): SpatialPoint[] {
    const points: SpatialPoint[] = [];
    
    // Calculate which cells overlap with the viewport
    const startCellX = Math.floor(viewport.left / this.cellSize);
    const endCellX = Math.floor(viewport.right / this.cellSize);
    const startCellY = Math.floor(viewport.top / this.cellSize);
    const endCellY = Math.floor(viewport.bottom / this.cellSize);

    // Collect points from overlapping cells
    for (let cellX = startCellX; cellX <= endCellX; cellX++) {
      for (let cellY = startCellY; cellY <= endCellY; cellY++) {
        const key = `${cellX},${cellY}`;
        const cellPoints = this.grid.get(key);
        if (cellPoints) {
          // Filter points that are actually in viewport
          for (const point of cellPoints) {
            if (isPointInViewport(point, viewport)) {
              points.push(point);
            }
          }
        }
      }
    }

    return points;
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.grid.clear();
  }

  /**
   * Get grid statistics
   */
  getStats(): { totalCells: number; totalPoints: number; averagePointsPerCell: number } {
    const totalCells = this.grid.size;
    let totalPoints = 0;
    
    for (const points of this.grid.values()) {
      totalPoints += points.length;
    }

    return {
      totalCells,
      totalPoints,
      averagePointsPerCell: totalCells > 0 ? totalPoints / totalCells : 0,
    };
  }
}

/**
 * Frustum culling for efficient rendering
 */
export class FrustumCuller {
  private viewport: Viewport;
  private margin: number;

  constructor(viewport: Viewport, margin: number = 50) {
    this.viewport = viewport;
    this.margin = margin;
  }

  updateViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  /**
   * Test if a point should be rendered
   */
  shouldRender(point: SpatialPoint): boolean {
    return isPointInViewport(point, {
      ...this.viewport,
      left: this.viewport.left - this.margin,
      top: this.viewport.top - this.margin,
      right: this.viewport.right + this.margin,
      bottom: this.viewport.bottom + this.margin,
    });
  }

  /**
   * Filter array of points to only visible ones
   */
  filterVisible<T extends SpatialPoint>(points: T[]): T[] {
    return points.filter(point => this.shouldRender(point));
  }

  /**
   * Get LOD level for a point based on distance from viewport center
   */
  getLODLevel(point: SpatialPoint): number {
    const distance = distanceToViewportCenter(point, this.viewport);
    const maxDistance = Math.max(this.viewport.width, this.viewport.height);
    return calculateLOD(distance, maxDistance);
  }
}

/**
 * Performance metrics for spatial optimization
 */
export interface SpatialMetrics {
  totalDots: number;
  visibleDots: number;
  culledDots: number;
  cullingRatio: number;
  spatialGridCells: number;
  spatialQueryTime: number;
}

/**
 * Spatial optimization manager
 */
export class SpatialOptimizer {
  private spatialGrid: SpatialGrid;
  private frustumCuller: FrustumCuller;
  private metrics: SpatialMetrics = {
    totalDots: 0,
    visibleDots: 0,
    culledDots: 0,
    cullingRatio: 0,
    spatialGridCells: 0,
    spatialQueryTime: 0,
  };

  constructor(bounds: SpatialBounds, viewport: Viewport) {
    this.spatialGrid = new SpatialGrid(bounds, 100);
    this.frustumCuller = new FrustumCuller(viewport);
  }

  /**
   * Update the viewport for culling
   */
  updateViewport(viewport: Viewport): void {
    this.frustumCuller.updateViewport(viewport);
  }

  /**
   * Process dots with spatial optimization
   */
  optimizeDots<T extends SpatialPoint>(dots: T[]): {
    visibleDots: T[];
    metrics: SpatialMetrics;
  } {
    const startTime = performance.now();

    // Clear and populate spatial grid
    this.spatialGrid.clear();
    dots.forEach(dot => this.spatialGrid.addPoint(dot));

    // Get visible dots using frustum culling
    const visibleDots = this.frustumCuller.filterVisible(dots);

    const endTime = performance.now();
    const gridStats = this.spatialGrid.getStats();

    // Update metrics
    this.metrics = {
      totalDots: dots.length,
      visibleDots: visibleDots.length,
      culledDots: dots.length - visibleDots.length,
      cullingRatio: dots.length > 0 ? (dots.length - visibleDots.length) / dots.length : 0,
      spatialGridCells: gridStats.totalCells,
      spatialQueryTime: endTime - startTime,
    };

    return {
      visibleDots,
      metrics: this.metrics,
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): SpatialMetrics {
    return { ...this.metrics };
  }
}