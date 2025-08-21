/**
 * Canvas Engine - Handle SVG rendering and drag-drop interactions
 */
class CanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.objectsGroup = this.canvas.querySelector('#objects');
        this.connectionsGroup = this.canvas.querySelector('#connections');
        
        this.objects = new Map();
        this.connections = [];
        this.selectedObject = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.canvasRect = { width: 800, height: 600 };
    }

    /**
     * Set canvas dimensions
     */
    setCanvasDimensions(width, height) {
        this.canvasRect = { width, height };
        this.canvas.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }

    /**
     * Clear all elements from canvas
     */
    clear() {
        this.objectsGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';
        this.objects.clear();
        this.connections = [];
        this.selectedObject = null;
    }

    /**
     * Render objects and connections
     */
    render(diagramData) {
        this.clear();
        
        // Store data
        diagramData.objects.forEach(obj => {
            this.objects.set(obj.id, obj);
        });
        this.connections = diagramData.connections;

        // Render connections first (behind objects)
        this.renderConnections();
        
        // Render objects
        this.renderObjects();
    }

    /**
     * Render all objects
     */
    renderObjects() {
        this.objects.forEach(obj => {
            const objectGroup = this.createObjectElement(obj);
            this.objectsGroup.appendChild(objectGroup);
        });
    }

    /**
     * Create SVG element for an object
     */
    createObjectElement(obj) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('uml-object');
        group.setAttribute('data-id', obj.id);
        group.setAttribute('transform', `translate(${obj.x}, ${obj.y})`);

        // Create rectangle
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.classList.add('object-rect');
        rect.setAttribute('width', obj.width);
        rect.setAttribute('height', obj.height);
        rect.setAttribute('x', 0);
        rect.setAttribute('y', 0);

        // Apply type-specific styling
        this.applyObjectTypeStyle(rect, obj.type);

        // Create text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('object-text');
        text.setAttribute('x', obj.width / 2);
        text.setAttribute('y', obj.height / 2);
        text.textContent = obj.name;

        // Add elements to group
        group.appendChild(rect);
        group.appendChild(text);

        return group;
    }

    /**
     * Apply type-specific styling to objects
     */
    applyObjectTypeStyle(rect, type) {
        const styles = {
            'actor': {
                fill: 'rgba(243, 226, 212, 0.3)',
                stroke: '#415E72',
                strokeWidth: '2',
                rx: '8'
            },
            'participant': {
                fill: '#ffffff',
                stroke: '#415E72',
                strokeWidth: '2',
                rx: '8'
            },
            'database': {
                fill: 'rgba(197, 176, 205, 0.2)',
                stroke: '#C5B0CD',
                strokeWidth: '2',
                rx: '15'
            },
            'entity': {
                fill: 'rgba(243, 226, 212, 0.4)',
                stroke: '#17313E',
                strokeWidth: '2',
                rx: '8'
            },
            'boundary': {
                fill: 'rgba(197, 176, 205, 0.3)',
                stroke: '#415E72',
                strokeWidth: '2',
                rx: '8'
            },
            'control': {
                fill: 'rgba(23, 49, 62, 0.1)',
                stroke: '#17313E',
                strokeWidth: '2',
                rx: '8'
            },
            'collections': {
                fill: 'rgba(65, 94, 114, 0.1)',
                stroke: '#415E72',
                strokeWidth: '2',
                rx: '12',
                strokeDasharray: '5,3'
            },
            'queue': {
                fill: 'rgba(243, 226, 212, 0.5)',
                stroke: '#C5B0CD',
                strokeWidth: '2',
                rx: '6'
            }
        };

        const style = styles[type] || styles['participant'];
        
        Object.entries(style).forEach(([key, value]) => {
            if (key === 'strokeDasharray') {
                rect.style[key] = value;
            } else {
                rect.setAttribute(key.replace(/([A-Z])/g, '-$1').toLowerCase(), value);
            }
        });
    }

    /**
     * Render all connections
     */
    renderConnections() {
        this.connections.forEach(conn => {
            const connectionGroup = this.createConnectionElement(conn);
            if (connectionGroup) {
                this.connectionsGroup.appendChild(connectionGroup);
            }
        });
    }

    /**
     * Create SVG element for a connection
     */
    createConnectionElement(conn) {
        const fromObj = this.objects.get(conn.from);
        const toObj = this.objects.get(conn.to);
        
        if (!fromObj || !toObj) return null;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('connection');
        group.setAttribute('data-id', conn.id);
        group.setAttribute('data-from', conn.from);
        group.setAttribute('data-to', conn.to);

        // Calculate connection points
        const { x1, y1, x2, y2 } = this.calculateConnectionPoints(fromObj, toObj);

        // Create line
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('connection-line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);

        // Apply connection style with important priority
        if (conn.style) {
            Object.entries(conn.style).forEach(([key, value]) => {
                if (key === 'strokeDasharray' && value !== 'none') {
                    line.style.setProperty('stroke-dasharray', value, 'important');
                } else if (key === 'strokeWidth') {
                    line.style.setProperty('stroke-width', value, 'important');
                } else if (key !== 'strokeDasharray') {
                    line.style.setProperty(key, value, 'important');
                }
            });
        }

        // Add special styling for different connection types
        if (conn.connectionType) {
            switch (conn.connectionType) {
                case 'dotted':
                case 'dotted_line':
                    line.style.strokeLinecap = 'round';
                    break;
                case 'double':
                    line.style.strokeLinecap = 'round';
                    break;
                case 'parallel':
                    line.style.strokeLinecap = 'square';
                    break;
            }
        }

        group.appendChild(line);

        // Add label if present
        if (conn.label && conn.label.trim()) {
            const label = this.createConnectionLabel(conn.label, x1, y1, x2, y2);
            group.appendChild(label);
        }

        return group;
    }

    /**
     * Create connection label
     */
    createConnectionLabel(labelText, x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('connection-label');
        text.setAttribute('x', midX);
        text.setAttribute('y', midY - 5);
        text.textContent = labelText;

        return text;
    }

    /**
     * Calculate connection points between two objects
     */
    calculateConnectionPoints(fromObj, toObj) {
        const fromCenter = {
            x: fromObj.x + fromObj.width / 2,
            y: fromObj.y + fromObj.height / 2
        };
        const toCenter = {
            x: toObj.x + toObj.width / 2,
            y: toObj.y + toObj.height / 2
        };

        // Calculate intersection points with object boundaries
        const fromEdge = this.getEdgeIntersection(fromObj, fromCenter, toCenter);
        const toEdge = this.getEdgeIntersection(toObj, toCenter, fromCenter);

        return {
            x1: fromEdge.x,
            y1: fromEdge.y,
            x2: toEdge.x,
            y2: toEdge.y
        };
    }

    /**
     * Get intersection point of line with object boundary
     */
    getEdgeIntersection(obj, center, targetCenter) {
        const dx = targetCenter.x - center.x;
        const dy = targetCenter.y - center.y;
        
        const left = obj.x;
        const right = obj.x + obj.width;
        const top = obj.y;
        const bottom = obj.y + obj.height;

        // Calculate intersections with all four sides
        const intersections = [];

        if (dx !== 0) {
            // Left edge
            const t1 = (left - center.x) / dx;
            const y1 = center.y + dy * t1;
            if (t1 >= 0 && y1 >= top && y1 <= bottom) {
                intersections.push({ x: left, y: y1, distance: Math.abs(t1) });
            }

            // Right edge
            const t2 = (right - center.x) / dx;
            const y2 = center.y + dy * t2;
            if (t2 >= 0 && y2 >= top && y2 <= bottom) {
                intersections.push({ x: right, y: y2, distance: Math.abs(t2) });
            }
        }

        if (dy !== 0) {
            // Top edge
            const t3 = (top - center.y) / dy;
            const x3 = center.x + dx * t3;
            if (t3 >= 0 && x3 >= left && x3 <= right) {
                intersections.push({ x: x3, y: top, distance: Math.abs(t3) });
            }

            // Bottom edge
            const t4 = (bottom - center.y) / dy;
            const x4 = center.x + dx * t4;
            if (t4 >= 0 && x4 >= left && x4 <= right) {
                intersections.push({ x: x4, y: bottom, distance: Math.abs(t4) });
            }
        }

        // Return the closest intersection
        if (intersections.length > 0) {
            const closest = intersections.reduce((min, curr) => 
                curr.distance < min.distance ? curr : min
            );
            return { x: closest.x, y: closest.y };
        }

        // Fallback to center
        return center;
    }

    /**
     * Update connections when objects move
     */
    updateConnections() {
        this.connectionsGroup.querySelectorAll('.connection').forEach(connGroup => {
            const fromId = connGroup.getAttribute('data-from');
            const toId = connGroup.getAttribute('data-to');
            const fromObj = this.objects.get(fromId);
            const toObj = this.objects.get(toId);

            if (fromObj && toObj) {
                const line = connGroup.querySelector('.connection-line');
                const label = connGroup.querySelector('.connection-label');
                
                const { x1, y1, x2, y2 } = this.calculateConnectionPoints(fromObj, toObj);
                
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);

                if (label) {
                    const midX = (x1 + x2) / 2;
                    const midY = (y1 + y2) / 2;
                    label.setAttribute('x', midX);
                    label.setAttribute('y', midY - 5);
                }
            }
        });
    }

    /**
     * Setup event listeners for drag and drop
     */
    setupEventListeners() {
        let startPos = { x: 0, y: 0 };

        this.canvas.addEventListener('mousedown', (e) => {
            const objectElement = e.target.closest('.uml-object');
            if (!objectElement) return;

            this.isDragging = true;
            this.selectedObject = objectElement;
            
            const objectId = objectElement.getAttribute('data-id');
            const obj = this.objects.get(objectId);
            
            const svgRect = this.canvas.getBoundingClientRect();
            const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * this.canvasRect.width;
            const mouseY = ((e.clientY - svgRect.top) / svgRect.height) * this.canvasRect.height;
            
            this.dragOffset = {
                x: mouseX - obj.x,
                y: mouseY - obj.y
            };

            startPos = { x: mouseX, y: mouseY };
            
            // Add selected class
            this.clearSelection();
            objectElement.classList.add('selected');
            
            e.preventDefault();
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging || !this.selectedObject) return;

            const objectId = this.selectedObject.getAttribute('data-id');
            const obj = this.objects.get(objectId);
            
            const svgRect = this.canvas.getBoundingClientRect();
            const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * this.canvasRect.width;
            const mouseY = ((e.clientY - svgRect.top) / svgRect.height) * this.canvasRect.height;
            
            // Update object position
            obj.x = Math.max(0, Math.min(mouseX - this.dragOffset.x, this.canvasRect.width - obj.width));
            obj.y = Math.max(0, Math.min(mouseY - this.dragOffset.y, this.canvasRect.height - obj.height));
            
            // Update visual position
            this.selectedObject.setAttribute('transform', `translate(${obj.x}, ${obj.y})`);
            
            // Update connections
            this.updateConnections();
            
            e.preventDefault();
        });

        document.addEventListener('mouseup', (e) => {
            if (this.isDragging) {
                const svgRect = this.canvas.getBoundingClientRect();
                const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * this.canvasRect.width;
                const mouseY = ((e.clientY - svgRect.top) / svgRect.height) * this.canvasRect.height;
                
                const distance = Math.sqrt(
                    Math.pow(mouseX - startPos.x, 2) + Math.pow(mouseY - startPos.y, 2)
                );
                
                // If it was more of a click than a drag, trigger click event
                if (distance < 5 && this.selectedObject) {
                    const clickEvent = new CustomEvent('objectClick', {
                        detail: {
                            objectId: this.selectedObject.getAttribute('data-id'),
                            element: this.selectedObject
                        }
                    });
                    this.canvas.dispatchEvent(clickEvent);
                }
                
                this.isDragging = false;
                this.selectedObject = null;
            }
        });

        // Handle clicks outside objects to clear selection
        this.canvas.addEventListener('click', (e) => {
            if (!e.target.closest('.uml-object')) {
                this.clearSelection();
            }
        });
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.objectsGroup.querySelectorAll('.uml-object').forEach(obj => {
            obj.classList.remove('selected');
        });
    }

    /**
     * Highlight object
     */
    highlightObject(objectId, className = 'highlighted') {
        const objectElement = this.objectsGroup.querySelector(`[data-id="${objectId}"]`);
        if (objectElement) {
            objectElement.classList.add(className);
            
            // Force style update to prevent black artifacts
            const rect = objectElement.querySelector('.object-rect');
            if (rect && className === 'highlighted') {
                rect.style.setProperty('stroke', '#415E72', 'important');
                rect.style.setProperty('fill', 'rgba(65, 94, 114, 0.1)', 'important');
                rect.style.setProperty('stroke-width', '4', 'important');
            }
        }
    }

    /**
     * Remove highlight from object
     */
    removeHighlight(objectId, className = 'highlighted') {
        const objectElement = this.objectsGroup.querySelector(`[data-id="${objectId}"]`);
        if (objectElement) {
            objectElement.classList.remove(className);
            
            // Reset to original styles when removing highlight
            const rect = objectElement.querySelector('.object-rect');
            if (rect && className === 'highlighted') {
                // Get original object data to restore colors
                const obj = this.objects.get(objectId);
                if (obj) {
                    this.applyObjectTypeStyle(rect, obj.type);
                }
            }
        }
    }

    /**
     * Highlight connection
     */
    highlightConnection(connectionId, className = 'active') {
        const connectionElement = this.connectionsGroup.querySelector(`[data-id="${connectionId}"]`);
        if (connectionElement) {
            const line = connectionElement.querySelector('.connection-line');
            if (line) {
                line.classList.add(className);
                
                // Force active connection styling to prevent black artifacts
                if (className === 'active') {
                    line.style.setProperty('stroke', '#C5B0CD', 'important');
                    line.style.setProperty('stroke-width', '4', 'important');
                    line.style.setProperty('marker-end', 'url(#arrowhead-active)', 'important');
                }
            }
        }
    }

    /**
     * Remove highlight from connection
     */
    removeConnectionHighlight(connectionId, className = 'active') {
        const connectionElement = this.connectionsGroup.querySelector(`[data-id="${connectionId}"]`);
        if (connectionElement) {
            const line = connectionElement.querySelector('.connection-line');
            if (line) {
                line.classList.remove(className);
                
                // Reset to original connection styling when removing highlight
                if (className === 'active') {
                    const connectionId = connectionElement.getAttribute('data-id');
                    const connection = this.connections.find(conn => conn.id === connectionId);
                    
                    // Restore original connection styles
                    line.style.setProperty('stroke', '#415E72', 'important');
                    line.style.setProperty('stroke-width', '2', 'important');
                    line.style.setProperty('marker-end', 'url(#arrowhead)', 'important');
                    
                    // Reapply connection-specific styles if they exist
                    if (connection && connection.style) {
                        Object.entries(connection.style).forEach(([key, value]) => {
                            if (key === 'strokeDasharray' && value !== 'none') {
                                line.style.setProperty('stroke-dasharray', value, 'important');
                            } else if (key === 'strokeWidth') {
                                line.style.setProperty('stroke-width', value, 'important');
                            } else if (key !== 'strokeDasharray') {
                                line.style.setProperty(key, value, 'important');
                            }
                        });
                    }
                }
            }
        }
    }

    /**
     * Clear all highlights
     */
    clearAllHighlights() {
        // Clear object highlights and restore original styles
        this.objectsGroup.querySelectorAll('.uml-object').forEach(obj => {
            obj.classList.remove('highlighted', 'selected', 'focused');
            
            // Restore original object styling
            const objectId = obj.getAttribute('data-id');
            const rect = obj.querySelector('.object-rect');
            const objectData = this.objects.get(objectId);
            
            if (rect && objectData) {
                this.applyObjectTypeStyle(rect, objectData.type);
            }
        });

        // Clear connection highlights and restore original styles
        this.connectionsGroup.querySelectorAll('.connection-line').forEach(line => {
            line.classList.remove('active');
            
            // Restore original connection styling
            const connectionElement = line.parentElement;
            const connectionId = connectionElement.getAttribute('data-id');
            const connection = this.connections.find(conn => conn.id === connectionId);
            
            // Reset to base styles
            line.style.setProperty('stroke', '#415E72', 'important');
            line.style.setProperty('stroke-width', '2', 'important');
            line.style.setProperty('marker-end', 'url(#arrowhead)', 'important');
            line.style.removeProperty('filter');
            line.style.removeProperty('stroke-dasharray');
            line.style.removeProperty('stroke-dashoffset');
            line.style.removeProperty('transition');
            
            // Reapply connection-specific styles
            if (connection && connection.style) {
                Object.entries(connection.style).forEach(([key, value]) => {
                    if (key === 'strokeDasharray' && value !== 'none') {
                        line.style.setProperty('stroke-dasharray', value, 'important');
                    } else if (key === 'strokeWidth') {
                        line.style.setProperty('stroke-width', value, 'important');
                    } else if (key !== 'strokeDasharray') {
                        line.style.setProperty(key, value, 'important');
                    }
                });
            }
        });
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasEngine;
}