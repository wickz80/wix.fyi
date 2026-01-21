import React, { useEffect, useRef, useState } from 'react';
import './gravity-modal.css';

interface GravityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

class Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    maxRadius: number;
    gravity: number;
    bounce: number;
    createdTime: number;
    lifetime: number;

    constructor(x: number, y: number, radius: number) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 12 + (Math.random() > 0.5 ? 3 : -3);
        this.vy = 0;
        this.radius = radius;
        this.maxRadius = radius;
        this.gravity = 0.6;
        this.bounce = 0.85;
        this.createdTime = Date.now();
        this.lifetime = 5000;
    }

    update(canvasWidth: number, canvasHeight: number) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (this.y + this.radius > canvasHeight) {
            this.y = canvasHeight - this.radius;
            this.vy *= -this.bounce;
        }

        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -this.bounce;
        } else if (this.x + this.radius > canvasWidth) {
            this.x = canvasWidth - this.radius;
            this.vx *= -this.bounce;
        }

        const age = Date.now() - this.createdTime;
        if (age > this.lifetime) {
            const decayProgress = (age - this.lifetime) / 1000;
            this.radius = this.maxRadius * Math.max(0, 1 - decayProgress);
        }
    }

    draw(ctx: CanvasRenderingContext2D, lineColor: string) {
        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isDecayed() {
        return this.radius <= 0;
    }
}

const GravityModal: React.FC<GravityModalProps> = ({ isOpen, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [numLines, setNumLines] = useState(150);
    const [lineColor, setLineColor] = useState('#00ff00');
    const [maxPull, setMaxPull] = useState(20);

    useEffect(() => {
        if (!isOpen || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const balls: Ball[] = [];
        let mouseX = canvas.width / 2;
        let mouseY = canvas.height / 2;
        let isHoldingMouse = false;
        let holdStartTime = 0;
        let holdX = 0;
        let holdY = 0;
        let currentBallSize = 0;
        let animationId: number;

        const setCanvasSize = () => {
            const modalContent = canvas.parentElement;
            if (modalContent) {
                canvas.width = modalContent.clientWidth;
                canvas.height = modalContent.clientHeight;
            }
        };

        setCanvasSize();

        const calculateGravityPull = (pointX: number, pointY: number, sourceX: number, sourceY: number, gravityStrength: number) => {
            const dx = pointX - sourceX;
            const dy = pointY - sourceY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 5) {
                return sourceY - pointY;
            }

            const pull = gravityStrength / (distance / 100 + 1);
            const angle = Math.atan2(sourceY - pointY, sourceX - pointX);
            return Math.sin(angle) * pull;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;

            if (isHoldingMouse) {
                holdX = mouseX;
                holdY = mouseY;
            }
        };

        const handleMouseDown = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            isHoldingMouse = true;
            holdStartTime = Date.now();
            holdX = e.clientX - rect.left;
            holdY = e.clientY - rect.top;
            currentBallSize = 5;
        };

        const handleMouseUp = () => {
            if (isHoldingMouse) {
                balls.push(new Ball(holdX, holdY, currentBallSize));
                isHoldingMouse = false;
                currentBallSize = 0;
            }
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('resize', setCanvasSize);

        const draw = () => {
            if (isHoldingMouse) {
                const holdDuration = Date.now() - holdStartTime;
                currentBallSize = Math.min(5 + holdDuration / 15, 80);
            }

            for (let i = balls.length - 1; i >= 0; i--) {
                balls[i].update(canvas.width, canvas.height);
                if (balls[i].isDecayed()) {
                    balls.splice(i, 1);
                }
            }

            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;

            const spacing = canvas.height / (numLines + 1);

            for (let i = 1; i <= numLines; i++) {
                const baseY = spacing * i;

                ctx.beginPath();

                for (let x = 0; x <= canvas.width; x += 5) {
                    let totalPullY = 0;

                    totalPullY += calculateGravityPull(x, baseY, mouseX, mouseY, maxPull);

                    for (let ball of balls) {
                        const ballGravityStrength = maxPull * (ball.radius / 20);
                        totalPullY += calculateGravityPull(x, baseY, ball.x, ball.y, ballGravityStrength);
                    }

                    if (isHoldingMouse) {
                        const growingBallGravity = maxPull * (currentBallSize / 20);
                        totalPullY += calculateGravityPull(x, baseY, holdX, holdY, growingBallGravity);
                    }

                    const y = baseY + totalPullY;

                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.stroke();
            }

            for (let ball of balls) {
                ball.draw(ctx, lineColor);
            }

            if (isHoldingMouse) {
                ctx.fillStyle = lineColor;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                ctx.arc(holdX, holdY, currentBallSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            animationId = requestAnimationFrame(draw);
        };

        animationId = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(animationId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('resize', setCanvasSize);
        };
    }, [isOpen, numLines, lineColor, maxPull]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <div className="gravity-controls">
                    <div className="control-group">
                        <label>
                            Number of Lines: <span className="value-display">{numLines}</span>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="300"
                            value={numLines}
                            onChange={(e) => setNumLines(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="control-group">
                        <label>Line Color:</label>
                        <input
                            type="color"
                            value={lineColor}
                            onChange={(e) => setLineColor(e.target.value)}
                        />
                    </div>
                    <div className="control-group">
                        <label>
                            Gravity Strength: <span className="value-display">{maxPull}</span>
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="150"
                            value={maxPull}
                            onChange={(e) => setMaxPull(parseInt(e.target.value))}
                        />
                    </div>
                    <div className="control-group">
                        <label>Click and hold to create balls!</label>
                    </div>
                </div>
                <canvas ref={canvasRef} className="gravity-canvas" />
            </div>
        </div>
    );
};

export default GravityModal;
