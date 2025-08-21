/**
 * Animation System - Handle flow animations and visual effects
 */
class AnimationSystem {
    constructor(canvasEngine) {
        this.canvas = canvasEngine;
        this.animationQueue = [];
        this.isAnimating = false;
        this.animationSpeed = 1.0;
        this.connections = [];
        this.flowGraph = new Map();
    }

    /**
     * Initialize with connections data
     */
    initialize(connections) {
        this.connections = connections;
        this.buildFlowGraph();
    }

    /**
     * Build a flow graph for navigation
     */
    buildFlowGraph() {
        this.flowGraph.clear();
        
        this.connections.forEach(conn => {
            if (!this.flowGraph.has(conn.from)) {
                this.flowGraph.set(conn.from, []);
            }
            this.flowGraph.get(conn.from).push({
                to: conn.to,
                connectionId: conn.id,
                label: conn.label
            });
        });
    }

    /**
     * Set animation speed
     */
    setSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5.0, speed));
    }

    /**
     * Start flow animation from a specific object
     */
    async startFlowAnimation(startObjectId) {
        if (this.isAnimating) {
            this.stopAnimation();
        }

        this.isAnimating = true;
        this.canvas.clearAllHighlights();

        try {
            await this.animateFlow(startObjectId, new Set());
        } catch (error) {
            console.error('Animation error:', error);
        } finally {
            this.isAnimating = false;
        }
    }

    /**
     * Animate flow starting from an object
     */
    async animateFlow(objectId, visitedObjects = new Set()) {
        if (!this.isAnimating || visitedObjects.has(objectId)) {
            return;
        }

        // Mark as visited to prevent infinite loops
        visitedObjects.add(objectId);

        // Highlight current object
        this.canvas.highlightObject(objectId, 'highlighted');
        await this.delay(300 / this.animationSpeed);

        if (!this.isAnimating) return;

        // Get outgoing connections
        const outgoingConnections = this.flowGraph.get(objectId) || [];
        
        if (outgoingConnections.length === 0) {
            // End of flow - keep highlighting for a moment
            await this.delay(500 / this.animationSpeed);
            return;
        }

        // Animate each outgoing connection
        for (const connection of outgoingConnections) {
            if (!this.isAnimating) break;

            // Animate the connection
            await this.animateConnection(connection.connectionId);
            
            if (!this.isAnimating) break;

            // Continue to next object
            await this.animateFlow(connection.to, new Set(visitedObjects));
            
            // Small delay between branches
            if (outgoingConnections.length > 1) {
                await this.delay(200 / this.animationSpeed);
            }
        }
    }

    /**
     * Animate a single connection
     */
    async animateConnection(connectionId) {
        return new Promise((resolve) => {
            if (!this.isAnimating) {
                resolve();
                return;
            }

            // Highlight the connection
            this.canvas.highlightConnection(connectionId, 'active');

            // Create flowing effect
            const connectionElement = this.canvas.connectionsGroup
                .querySelector(`[data-id="${connectionId}"]`);
            
            if (connectionElement) {
                const line = connectionElement.querySelector('.connection-line');
                if (line) {
                    // Add flowing animation
                    this.createFlowingEffect(line);
                }
            }

            // Wait for animation duration
            setTimeout(() => {
                // Remove flowing effect but keep connection highlighted briefly
                setTimeout(() => {
                    if (this.isAnimating) {
                        this.canvas.removeConnectionHighlight(connectionId, 'active');
                    }
                    resolve();
                }, 100 / this.animationSpeed);
            }, 600 / this.animationSpeed);
        });
    }

    /**
     * Create enhanced flowing effect on connection line
     */
    createFlowingEffect(line) {
        // Calculate line length for dash animation
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        // Store original styles
        const originalStyles = {
            strokeDasharray: line.style.strokeDasharray || 'none',
            strokeDashoffset: line.style.strokeDashoffset || '0',
            transition: line.style.transition || '',
            strokeWidth: line.style.strokeWidth || line.getAttribute('stroke-width') || '2'
        };

        // Enhanced flowing effect based on connection type
        const connectionType = this.getConnectionType(line);
        const animationDuration = 0.8 / this.animationSpeed;
        
        switch (connectionType) {
            case 'dotted':
                this.createDottedFlowEffect(line, length, animationDuration, originalStyles);
                break;
            case 'dashed':
                this.createDashedFlowEffect(line, length, animationDuration, originalStyles);
                break;
            case 'double':
                this.createDoubleLineEffect(line, length, animationDuration, originalStyles);
                break;
            default:
                this.createSolidFlowEffect(line, length, animationDuration, originalStyles);
        }
    }

    /**
     * Create solid line flowing effect
     */
    createSolidFlowEffect(line, length, duration, originalStyles) {
        const dashLength = Math.max(length * 0.15, 20);
        
        line.style.strokeDasharray = `${dashLength}, ${length}`;
        line.style.strokeDashoffset = length + dashLength;
        line.style.transition = `stroke-dashoffset ${duration}s ease-out`;
        
        // Add glow effect
        line.style.filter = 'drop-shadow(0 0 3px currentColor)';
        
        setTimeout(() => {
            line.style.strokeDashoffset = '0';
        }, 10);

        this.resetStylesAfterDelay(line, originalStyles, duration * 1000 + 100);
    }

    /**
     * Create dotted line flowing effect
     */
    createDottedFlowEffect(line, length, duration, originalStyles) {
        const dotSize = 3;
        const spacing = 6;
        
        line.style.strokeDasharray = `${dotSize}, ${spacing}`;
        line.style.strokeLinecap = 'round';
        line.style.strokeDashoffset = length;
        line.style.transition = `stroke-dashoffset ${duration}s linear`;
        
        setTimeout(() => {
            line.style.strokeDashoffset = `-${length}`;
        }, 10);

        this.resetStylesAfterDelay(line, originalStyles, duration * 1000 + 100);
    }

    /**
     * Create dashed line flowing effect
     */
    createDashedFlowEffect(line, length, duration, originalStyles) {
        const dashSize = 8;
        const gapSize = 6;
        
        line.style.strokeDasharray = `${dashSize}, ${gapSize}`;
        line.style.strokeDashoffset = length;
        line.style.transition = `stroke-dashoffset ${duration}s linear`;
        
        setTimeout(() => {
            line.style.strokeDashoffset = `-${length}`;
        }, 10);

        this.resetStylesAfterDelay(line, originalStyles, duration * 1000 + 100);
    }

    /**
     * Create double line effect
     */
    createDoubleLineEffect(line, length, duration, originalStyles) {
        const originalWidth = parseFloat(originalStyles.strokeWidth);
        
        // Animate thickness change
        line.style.strokeWidth = `${originalWidth * 2}`;
        line.style.transition = `stroke-width ${duration * 0.3}s ease-out, stroke-dashoffset ${duration}s linear`;
        line.style.strokeDasharray = `${length * 0.2}, ${length}`;
        line.style.strokeDashoffset = length;
        
        setTimeout(() => {
            line.style.strokeDashoffset = '0';
        }, 10);

        this.resetStylesAfterDelay(line, originalStyles, duration * 1000 + 100);
    }

    /**
     * Get connection type from line element
     */
    getConnectionType(line) {
        const parent = line.parentElement;
        if (!parent) return 'solid';
        
        const connectionId = parent.getAttribute('data-id');
        const connection = this.connections.find(conn => conn.id === connectionId);
        
        return connection ? connection.connectionType || 'solid' : 'solid';
    }

    /**
     * Reset line styles after animation
     */
    resetStylesAfterDelay(line, originalStyles, delay) {
        setTimeout(() => {
            Object.entries(originalStyles).forEach(([key, value]) => {
                if (value === 'none' || value === '') {
                    line.style[key] = '';
                } else {
                    line.style.setProperty(key, value, 'important');
                }
            });
            line.style.filter = '';
            
            // Ensure connection maintains its base styling
            if (!line.style.stroke || line.style.stroke === '') {
                line.style.setProperty('stroke', '#415E72', 'important');
            }
            if (!line.style.strokeWidth || line.style.strokeWidth === '') {
                line.style.setProperty('stroke-width', '2', 'important');
            }
        }, delay);
    }

    /**
     * Stop current animation
     */
    stopAnimation() {
        this.isAnimating = false;
        this.animationQueue = [];
        this.canvas.clearAllHighlights();
        
        // Clear any ongoing CSS transitions
        const allLines = this.canvas.connectionsGroup
            .querySelectorAll('.connection-line');
        allLines.forEach(line => {
            line.style.transition = '';
            line.style.strokeDasharray = '';
            line.style.strokeDashoffset = '';
        });
    }

    /**
     * Animate all flows sequentially
     */
    async animateAllFlows() {
        if (this.isAnimating) {
            this.stopAnimation();
        }

        this.isAnimating = true;
        this.canvas.clearAllHighlights();

        // Find all starting points (objects with no incoming connections)
        const allObjectIds = new Set();
        const objectsWithIncoming = new Set();

        this.connections.forEach(conn => {
            allObjectIds.add(conn.from);
            allObjectIds.add(conn.to);
            objectsWithIncoming.add(conn.to);
        });

        const startingPoints = Array.from(allObjectIds)
            .filter(id => !objectsWithIncoming.has(id));

        // If no clear starting points, use the first object
        if (startingPoints.length === 0 && allObjectIds.size > 0) {
            startingPoints.push(Array.from(allObjectIds)[0]);
        }

        // Animate from each starting point
        for (const startId of startingPoints) {
            if (!this.isAnimating) break;
            
            await this.animateFlow(startId);
            
            if (startingPoints.length > 1) {
                await this.delay(1000 / this.animationSpeed);
                this.canvas.clearAllHighlights();
            }
        }

        this.isAnimating = false;
    }

    /**
     * Create pulsing effect for object
     */
    createPulseEffect(objectId, duration = 1000) {
        const objectElement = this.canvas.objectsGroup
            .querySelector(`[data-id="${objectId}"]`);
        
        if (objectElement) {
            objectElement.style.animation = `pulse ${duration}ms ease-in-out infinite`;
            
            setTimeout(() => {
                objectElement.style.animation = '';
            }, duration * 3);
        }
    }

    /**
     * Create ripple effect from object
     */
    createRippleEffect(objectId) {
        const objectElement = this.canvas.objectsGroup
            .querySelector(`[data-id="${objectId}"]`);
        
        if (!objectElement) return;

        const obj = this.canvas.objects.get(objectId);
        if (!obj) return;

        // Create ripple circle
        const ripple = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;

        ripple.setAttribute('cx', centerX);
        ripple.setAttribute('cy', centerY);
        ripple.setAttribute('r', 0);
        ripple.setAttribute('fill', 'none');
        ripple.setAttribute('stroke', '#ff4444');
        ripple.setAttribute('stroke-width', 2);
        ripple.setAttribute('opacity', 0.7);

        this.canvas.objectsGroup.appendChild(ripple);

        // Animate ripple
        ripple.style.transition = 'r 0.8s ease-out, opacity 0.8s ease-out';
        
        setTimeout(() => {
            ripple.setAttribute('r', Math.max(obj.width, obj.height) * 2);
            ripple.setAttribute('opacity', 0);
        }, 50);

        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 1000);
    }

    /**
     * Highlight path between two objects
     */
    async highlightPath(fromId, toId) {
        const path = this.findPath(fromId, toId);
        if (!path || path.length < 2) return;

        this.canvas.clearAllHighlights();

        for (let i = 0; i < path.length - 1; i++) {
            const currentId = path[i];
            const nextId = path[i + 1];
            
            // Find connection between current and next
            const connection = this.connections.find(conn => 
                conn.from === currentId && conn.to === nextId
            );

            if (connection) {
                this.canvas.highlightObject(currentId, 'highlighted');
                await this.delay(300 / this.animationSpeed);
                
                this.canvas.highlightConnection(connection.id, 'active');
                await this.delay(300 / this.animationSpeed);
            }
        }

        // Highlight final object
        this.canvas.highlightObject(toId, 'highlighted');
    }

    /**
     * Find path between two objects using BFS
     */
    findPath(fromId, toId) {
        if (fromId === toId) return [fromId];

        const visited = new Set();
        const queue = [{ id: fromId, path: [fromId] }];

        while (queue.length > 0) {
            const { id, path } = queue.shift();
            
            if (visited.has(id)) continue;
            visited.add(id);

            const connections = this.flowGraph.get(id) || [];
            
            for (const conn of connections) {
                if (conn.to === toId) {
                    return [...path, toId];
                }
                
                if (!visited.has(conn.to)) {
                    queue.push({
                        id: conn.to,
                        path: [...path, conn.to]
                    });
                }
            }
        }

        return null;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get animation statistics
     */
    getStats() {
        return {
            isAnimating: this.isAnimating,
            speed: this.animationSpeed,
            queueLength: this.animationQueue.length,
            connectionCount: this.connections.length,
            nodeCount: this.flowGraph.size
        };
    }

    /**
     * Preview animation path for an object
     */
    previewPath(objectId) {
        const visited = new Set();
        const path = [];
        
        const traverse = (id) => {
            if (visited.has(id)) return;
            visited.add(id);
            path.push(id);
            
            const connections = this.flowGraph.get(id) || [];
            connections.forEach(conn => traverse(conn.to));
        };

        traverse(objectId);
        return path;
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationSystem;
}