/**
 * Background Animation Web Worker (Public Build)
 * This is the compiled version served from /public/workers/
 */

class BackgroundAnimationWorker {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationState = {
      time: 0,
      canvas: { width: 800, height: 600 },
      currentSection: 'home',
      isMobile: false,
    };
    this.animationFrame = 0;
    this.isRunning = false;

    self.addEventListener('message', this.handleMessage.bind(this));
  }

  handleMessage(event) {
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

  initCanvas(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    if (!this.ctx) {
      console.error('Failed to get 2D context from OffscreenCanvas');
      return;
    }

    this.animationState.canvas = { width, height };
    canvas.width = width;
    canvas.height = height;

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    this.postMessage({
      type: 'CANVAS_INITIALIZED',
      payload: { success: true },
    });
  }

  startAnimation() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stopAnimation() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  updateState(newState) {
    this.animationState = { ...this.animationState, ...newState };
  }

  resizeCanvas(width, height) {
    if (!this.canvas) return;
    
    this.canvas.width = width;
    this.canvas.height = height;
    this.animationState.canvas = { width, height };
  }

  animate() {
    if (!this.isRunning || !this.ctx || !this.canvas) return;

    const frameStart = performance.now();

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.animationState.time += 0.008;

    const animationData = this.calculateAnimationData();
    this.renderAnimation(animationData);

    const frameEnd = performance.now();
    const frameDuration = frameEnd - frameStart;

    this.postMessage({
      type: 'PERFORMANCE_DATA',
      payload: {
        frameDuration,
        time: this.animationState.time,
      },
    });

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  calculateAnimationData() {
    const { time, canvas } = this.animationState;
    
    const sphereX = canvas.width / 2 + Math.sin(time * 0.5) * 20;
    const sphereY = canvas.height / 2 + Math.cos(time * 0.3) * 15;
    const sphereZ = Math.sin(time * 0.4) * 0.1;
    const radius = Math.min(canvas.width, canvas.height) * 0.25;

    const sphereInfo = { x: sphereX, y: sphereY, z: sphereZ, radius };

    return {
      sphereInfo,
      staticDots: this.calculateStaticDots(sphereInfo),
      planetDots: this.calculatePlanetDots(sphereInfo),
      orbitalBigDots: this.calculateOrbitalBigDots(sphereInfo),
      backgroundPattern: { dots: [] },
    };
  }

  calculateStaticDots(sphereInfo) {
    const dots = [];
    const dotCount = 100;

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const distance = 50 + (i % 30);
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle + this.animationState.time) * distance,
        y: sphereInfo.y + Math.sin(angle + this.animationState.time) * distance,
        size: 1 + Math.sin(this.animationState.time + i) * 0.5,
        depth: 0.5,
        color: '#8B4513',
        alpha: 0.6,
      });
    }

    return dots;
  }

  calculatePlanetDots(sphereInfo) {
    const dots = [];
    const planetCount = 5;

    for (let i = 0; i < planetCount; i++) {
      const angle = this.animationState.time * 0.3 + (i * Math.PI * 2) / planetCount;
      const distance = 80 + i * 20;
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle) * distance,
        y: sphereInfo.y + Math.sin(angle) * distance,
        size: 3 + i * 0.5,
        depth: 0.8,
        color: i >= 3 ? '#F5DEB3' : '#DC143C',
        alpha: 0.8,
      });
    }

    return dots;
  }

  calculateOrbitalBigDots(sphereInfo) {
    const dots = [];
    const orbitalCount = 6;

    for (let i = 0; i < orbitalCount; i++) {
      const angle = this.animationState.time * 0.4 + (i * Math.PI * 2) / orbitalCount;
      const distance = 120 + Math.sin(this.animationState.time + i) * 20;
      
      dots.push({
        x: sphereInfo.x + Math.cos(angle) * distance,
        y: sphereInfo.y + Math.sin(angle) * distance,
        size: 2 + Math.cos(this.animationState.time + i) * 0.5,
        depth: 0.7,
        color: '#0000FF',
        alpha: 0.7,
      });
    }

    return dots;
  }

  renderAnimation(data) {
    if (!this.ctx) return;

    this.renderBackgroundPattern();
    this.setupSphereClipping(data.sphereInfo);
    this.renderDots([
      ...data.staticDots,
      ...data.planetDots,
      ...data.orbitalBigDots,
    ]);
    this.renderSphereGlow(data.sphereInfo);
  }

  renderBackgroundPattern() {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = 'rgba(139, 69, 19, 0.02)';
    
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.animationState.canvas.width;
      const y = (i * 23) % this.animationState.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  setupSphereClipping(sphereInfo) {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(sphereInfo.x, sphereInfo.y, sphereInfo.radius * 3.45, 0, Math.PI * 2);
    this.ctx.clip();
  }

  renderDots(dots) {
    if (!this.ctx) return;

    dots.forEach(dot => {
      this.ctx.globalAlpha = dot.alpha;
      this.ctx.fillStyle = dot.color;
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.ctx.globalAlpha = 1;
  }

  renderSphereGlow(sphereInfo) {
    if (!this.ctx) return;

    this.ctx.restore();

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

  postMessage(message) {
    self.postMessage(message);
  }
}

// Initialize the worker
new BackgroundAnimationWorker();