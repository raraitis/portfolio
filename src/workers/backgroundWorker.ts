/**
 * Background Animation Web Worker
 * Handles all animation calculations in a separate thread to keep the main thread responsive
 */

// Import types for Web Worker environment
interface AnimationState {
  time: number;
  canvas: {
    width: number;
    height: number;
  };
  currentSection: 'home' | 'me';
  isMobile: boolean;
}

interface DotPosition {
  x: number;
  y: number;
  size: number;
  depth: number;
  color: string;
  alpha: number;
}

interface SphereInfo {
  x: number;
  y: number;
  z: number;
  radius: number;
}

interface AnimationData {
  sphereInfo: SphereInfo;
  staticDots: DotPosition[];
  planetDots: DotPosition[];
  orbitalBigDots: DotPosition[];
  backgroundPattern: {
    dots: DotPosition[];
  };
}

class BackgroundAnimationWorker {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;
  private animationState: AnimationState = {
    time: 0,
    canvas: { width: 800, height: 600 },
    currentSection: 'home',
    isMobile: false,
  };
  private animationFrame: number = 0;
  private isRunning: boolean = false;

  constructor() {
    // Listen for messages from main thread
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private handleMessage(event: MessageEvent) {
    const { type, payload } = event.data;

    switch (type) {
      case 'INIT_CANVAS':
        this.initCanvas(payload.canvas, payload.width, payload.height);
        break;
      case 'START_ANIMATION':
        this.startAnimation();
        break;
      case 'STOP_ANIMATION':
        this.stopAnimation();
        break;
      case 'UPDATE_STATE':
        this.updateState(payload);
        break;
      case 'RESIZE_CANVAS':
        this.resizeCanvas(payload.width, payload.height);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  private initCanvas(canvas: OffscreenCanvas, width: number, height: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get 2D context from OffscreenCanvas');
      return;
    }

    this.animationState.canvas = { width, height };
    canvas.width = width;
    canvas.height = height;

    // Initialize canvas settings
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.postMessage({
      type: 'CANVAS_INITIALIZED',
      payload: { success: true },
    });
  }

  private startAnimation() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  private stopAnimation() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  private updateState(newState: Partial<AnimationState>) {
    this.animationState = { ...this.animationState, ...newState };
  }

  private resizeCanvas(width: number, height: number) {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.animationState.canvas = { width, height };
  }

  private animate() {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    // Performance measurement
    const frameStart = performance.now();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Update animation time
    this.animationState.time += 0.008;

    // Calculate animation data
    const animationData = this.calculateAnimationData();

    // Render everything
    this.renderAnimation(animationData);

    // Performance measurement
    const frameEnd = performance.now();
    const frameDuration = frameEnd - frameStart;

    // Send performance data to main thread
    this.postMessage({
      type: 'PERFORMANCE_DATA',
      payload: {
        frameDuration,
        time: this.animationState.time,
      },
    });

    // Continue animation loop
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  private calculateAnimationData(): AnimationData {
    const { time, canvas, currentSection } = this.animationState;
    
    // Calculate sphere info (simplified for worker)
    const sphereX = canvas.width / 2 + Math.sin(time * 0.5) * 20;
    const sphereY = canvas.height / 2 + Math.cos(time * 0.3) * 15;
    const sphereZ = Math.sin(time * 0.4) * 0.1;
    const radius = Math.min(canvas.width, canvas.height) * 0.25;

    const sphereInfo: SphereInfo = { x: sphereX, y: sphereY, z: sphereZ, radius };

    // For now, return simplified data - we'll expand this as we migrate functionality
    return {
      sphereInfo,
      staticDots: this.calculateStaticDots(sphereInfo),
      planetDots: this.calculatePlanetDots(sphereInfo),
      orbitalBigDots: this.calculateOrbitalBigDots(sphereInfo),
      backgroundPattern: { dots: [] },
    };
  }

  private calculateStaticDots(sphereInfo: SphereInfo): DotPosition[] {
    // Simplified static dots calculation
    // TODO: Migrate full static dots logic from BackgroundElements.tsx
    const dots: DotPosition[] = [];
    const dotCount = 100; // Simplified for now

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const distance = 50 + (i % 30);
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle + this.animationState.time) * distance,
        y: sphereInfo.y + Math.sin(angle + this.animationState.time) * distance,
        size: 1 + Math.sin(this.animationState.time + i) * 0.5,
        depth: 0.5,
        color: '#8B4513', // Brown for static dots
        alpha: 0.6,
      });
    }

    return dots;
  }

  private calculatePlanetDots(sphereInfo: SphereInfo): DotPosition[] {
    // Simplified planet dots calculation
    // TODO: Migrate full planet dots logic from BackgroundElements.tsx
    const dots: DotPosition[] = [];
    const planetCount = 5;

    for (let i = 0; i < planetCount; i++) {
      const angle = this.animationState.time * 0.3 + (i * Math.PI * 2) / planetCount;
      const distance = 80 + i * 20;
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle) * distance,
        y: sphereInfo.y + Math.sin(angle) * distance,
        size: 3 + i * 0.5,
        depth: 0.8,
        color: i >= 3 ? '#F5DEB3' : '#DC143C', // BEIGE for fat planets, RED for normal
        alpha: 0.8,
      });
    }

    return dots;
  }

  private calculateOrbitalBigDots(sphereInfo: SphereInfo): DotPosition[] {
    // Simplified orbital big dots calculation
    // TODO: Migrate full orbital big dots logic from BackgroundElements.tsx
    const dots: DotPosition[] = [];
    const orbitalCount = 6;

    for (let i = 0; i < orbitalCount; i++) {
      const angle = this.animationState.time * 0.4 + (i * Math.PI * 2) / orbitalCount;
      const distance = 120 + Math.sin(this.animationState.time + i) * 20;
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle) * distance,
        y: sphereInfo.y + Math.sin(angle) * distance,
        size: 2 + Math.cos(this.animationState.time + i) * 0.5,
        depth: 0.7,
        color: '#0000FF', // Blue for orbital dots
        alpha: 0.7,
      });
    }

    return dots;
  }

  private renderAnimation(data: AnimationData) {
    if (!this.ctx) return;

    // Render background pattern
    this.renderBackgroundPattern();

    // Render sphere clipping area
    this.setupSphereClipping(data.sphereInfo);

    // Render all dots
    this.renderDots([
      ...data.staticDots,
      ...data.planetDots,
      ...data.orbitalBigDots,
    ]);

    // Render sphere glow
    this.renderSphereGlow(data.sphereInfo);
  }

  private renderBackgroundPattern() {
    if (!this.ctx) return;
    
    // Simplified background pattern
    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.02)'; // Very faint brown
    
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.animationState.canvas.width;
      const y = (i * 23) % this.animationState.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private setupSphereClipping(sphereInfo: SphereInfo) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(sphereInfo.x, sphereInfo.y, sphereInfo.radius * 3.45, 0, Math.PI * 2);
    this.ctx.clip();
  }

  private renderDots(dots: DotPosition[]) {
    if (!this.ctx) return;

    dots.forEach(dot => {
      this.ctx!.globalAlpha = dot.alpha;
      this.ctx!.fillStyle = dot.color;
      this.ctx!.beginPath();
      this.ctx!.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      this.ctx!.fill();
    });

    this.ctx.globalAlpha = 1;
  }

  private renderSphereGlow(sphereInfo: SphereInfo) {
    if (!this.ctx) return;

    this.ctx.restore(); // Remove clipping

    // Simple glow effect
    const gradient = this.ctx.createRadialGradient(
      sphereInfo.x, sphereInfo.y, sphereInfo.radius * 0.8,
      sphereInfo.x, sphereInfo.y, sphereInfo.radius * 1.5
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(sphereInfo.x, sphereInfo.y, sphereInfo.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private postMessage(message: any) {
    self.postMessage(message);
  }
}

// Initialize the worker
const worker = new BackgroundAnimationWorker();

export default worker;