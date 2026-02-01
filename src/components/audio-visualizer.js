/**
 * Modern Audio Visualizer Component
 */
export class AudioVisualizer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');
        this.analyser = null;
        this.animationId = null;
        this.audioContext = null;

        // Match modern theme colors
        this.colors = ['#06B6D4', '#0EA5E9', '#8B5CF6'];
    }

    connect(audioStream) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(audioStream);

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 64; // Fewer bars for cleaner look
            this.analyser.smoothingTimeConstant = 0.85;

            source.connect(this.analyser);
            this.draw();
        } catch (error) {
            console.error('Failed to create audio visualizer:', error);
        }
    }

    draw() {
        this.animationId = requestAnimationFrame(() => this.draw());

        if (!this.analyser) return;

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);

        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerY = height / 2;

        // Clear canvas with slight transparency for a trail effect if desired
        // but for this design clear is better for glassmorphism
        this.ctx.clearRect(0, 0, width, height);

        // Calculate bar metrics
        const barWidth = (width / bufferLength) * 0.8;
        const gap = (width / bufferLength) * 0.2;

        // Center the bars horizontally
        let x = (width - (barWidth + gap) * bufferLength) / 2;

        for (let i = 0; i < bufferLength; i++) {
            // Normalize height
            const barHeight = (dataArray[i] / 255) * height * 0.6 + 4;

            // Gradient based on index
            const gradient = this.ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
            gradient.addColorStop(0, '#8B5CF6'); // Violet
            gradient.addColorStop(0.5, '#0EA5E9'); // Sky Blue
            gradient.addColorStop(1, '#06B6D4'); // Cyan

            this.ctx.fillStyle = gradient;

            // Draw symmetric rounded bar from center
            this.ctx.beginPath();
            const radius = barWidth / 2;
            this.ctx.roundRect(
                x,
                centerY - barHeight / 2,
                barWidth,
                barHeight,
                radius
            );
            this.ctx.fill();

            x += barWidth + gap;
        }
    }

    disconnect() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.analyser = null;
    }
}
