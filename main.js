/**
 * Main Application Controller
 * Coordinates all components and handles user interactions
 */
class AnimatedPlantUMLApp {
    constructor() {
        this.parser = new PlantUMLParser();
        this.canvas = new CanvasEngine('diagram-canvas');
        this.animator = new AnimationSystem(this.canvas);
        
        this.currentDiagram = null;
        this.isInitialized = false;
        this.settings = {
            autoAnimate: true,
            showLabels: true,
            soundEffects: false
        };
        
        this.initializeApp();
    }

    /**
     * Initialize the application
     */
    initializeApp() {
        this.setupEventListeners();
        this.setupCanvasEvents();
        this.loadSampleDiagram();
        this.isInitialized = true;
        
        console.log('🎯 Animated PlantUML App initialized successfully!');
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Generate button
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.addEventListener('click', () => this.generateDiagram());

        // Animate button
        const animateBtn = document.getElementById('animate-btn');
        animateBtn.addEventListener('click', () => this.startFullAnimation());

        // Reset button
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => this.resetDiagram());

        // Sample selector
        const sampleSelect = document.getElementById('sample-select');
        const loadSampleBtn = document.getElementById('load-sample-btn');
        
        loadSampleBtn.addEventListener('click', () => {
            this.loadSelectedSample(sampleSelect.value);
        });

        sampleSelect.addEventListener('change', () => {
            this.loadSelectedSample(sampleSelect.value);
        });

        // Animation speed control
        const speedSlider = document.getElementById('animation-speed');
        const speedValue = document.getElementById('speed-value');
        
        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.animator.setSpeed(speed);
            speedValue.textContent = `${speed.toFixed(1)}x`;
        });

        // Advanced controls
        const showLabelsCheckbox = document.getElementById('show-labels');
        const autoAnimateCheckbox = document.getElementById('auto-animate');
        const soundEffectsCheckbox = document.getElementById('sound-effects');

        showLabelsCheckbox.addEventListener('change', (e) => {
            this.toggleLabels(e.target.checked);
        });

        autoAnimateCheckbox.addEventListener('change', (e) => {
            this.settings.autoAnimate = e.target.checked;
        });

        soundEffectsCheckbox.addEventListener('change', (e) => {
            this.settings.soundEffects = e.target.checked;
            // TODO: Implement sound effects
        });

        // Enhanced keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Handle shortcuts with Ctrl/Cmd
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        this.generateDiagram();
                        break;
                    case ' ':
                        e.preventDefault();
                        this.startFullAnimation();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.resetDiagram();
                        break;
                    case '=':
                    case '+':
                        e.preventDefault();
                        this.adjustAnimationSpeed(0.1);
                        break;
                    case '-':
                        e.preventDefault();
                        this.adjustAnimationSpeed(-0.1);
                        break;
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                        e.preventDefault();
                        this.loadSampleByNumber(parseInt(e.key));
                        break;
                }
            } 
            // Handle other shortcuts
            else {
                switch (e.key) {
                    case 'Escape':
                        this.animator.stopAnimation();
                        break;
                    case 'Tab':
                        if (e.target.tagName === 'TEXTAREA') return;
                        e.preventDefault();
                        this.focusNextObject();
                        break;
                    case ' ':
                        if (e.target.tagName === 'TEXTAREA') return;
                        e.preventDefault();
                        this.startFullAnimation();
                        break;
                    case 'h':
                    case '?':
                        e.preventDefault();
                        this.showHelp();
                        break;
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * Setup canvas-specific event listeners
     */
    setupCanvasEvents() {
        // Object click events for flow animation
        this.canvas.canvas.addEventListener('objectClick', (e) => {
            const objectId = e.detail.objectId;
            console.log(`🎯 Object clicked: ${objectId}`);
            
            // Create ripple effect
            this.animator.createRippleEffect(objectId);
            
            // Start flow animation from this object
            setTimeout(() => {
                this.animator.startFlowAnimation(objectId);
            }, 300);
        });

        // Canvas click to stop animation
        this.canvas.canvas.addEventListener('click', (e) => {
            if (!e.target.closest('.uml-object')) {
                // Clicked on empty space - stop animation
                this.animator.stopAnimation();
            }
        });
    }

    /**
     * Generate diagram from PlantUML input
     */
    generateDiagram() {
        try {
            const input = document.getElementById('plantuml-input').value.trim();
            
            if (!input) {
                this.showMessage('PlantUML 텍스트를 입력해주세요.', 'warning');
                return;
            }

            // Parse the PlantUML text
            const diagramData = this.parser.parse(input);
            
            if (diagramData.objects.length === 0) {
                this.showMessage('유효한 PlantUML 객체를 찾을 수 없습니다.', 'error');
                return;
            }

            // Auto-layout objects
            this.parser.autoLayout(diagramData.objects, 800, 600);

            // Store current diagram
            this.currentDiagram = diagramData;

            // Render the diagram
            this.canvas.render(diagramData);

            // Initialize animator with connections
            this.animator.initialize(diagramData.connections);

            // Update button states
            this.updateButtonStates();

            // Show success message
            this.showMessage(
                `다이어그램 생성 완료! 객체 ${diagramData.objects.length}개, 연결 ${diagramData.connections.length}개`,
                'success'
            );

            console.log('📊 Diagram generated:', diagramData);

        } catch (error) {
            console.error('Generation error:', error);
            this.showMessage('다이어그램 생성 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Start full animation sequence
     */
    async startFullAnimation() {
        if (!this.currentDiagram || this.currentDiagram.objects.length === 0) {
            this.showMessage('먼저 다이어그램을 생성해주세요.', 'warning');
            return;
        }

        try {
            await this.animator.animateAllFlows();
            console.log('🎬 Full animation completed');
        } catch (error) {
            console.error('Animation error:', error);
            this.showMessage('애니메이션 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Reset diagram and clear canvas
     */
    resetDiagram() {
        this.animator.stopAnimation();
        this.canvas.clear();
        this.currentDiagram = null;
        
        // Reset input to sample
        this.loadSampleDiagram();
        this.updateButtonStates();
        
        this.showMessage('다이어그램이 초기화되었습니다.', 'info');
        console.log('🔄 Diagram reset');
    }

    /**
     * Load sample diagram
     */
    loadSampleDiagram() {
        const sampleInput = PlantUMLParser.getSampleDiagram();
        document.getElementById('plantuml-input').value = sampleInput;
        
        // Auto-generate the sample
        setTimeout(() => {
            this.generateDiagram();
        }, 100);
    }

    /**
     * Load selected sample from dropdown
     */
    loadSelectedSample(sampleType) {
        let sampleInput = '';
        
        switch (sampleType) {
            case 'simple':
                sampleInput = PlantUMLParser.getAdvancedSamples().simple;
                break;
            case 'ecommerce':
                sampleInput = PlantUMLParser.getAdvancedSamples().ecommerce;
                break;
            case 'microservice':
                sampleInput = PlantUMLParser.getAdvancedSamples().microservice;
                break;
            default:
                sampleInput = PlantUMLParser.getSampleDiagram();
                break;
        }
        
        document.getElementById('plantuml-input').value = sampleInput;
        
        // Auto-generate if auto-animate is enabled
        if (this.settings.autoAnimate) {
            setTimeout(() => {
                this.generateDiagram();
                if (sampleType !== 'simple') {
                    setTimeout(() => {
                        this.startFullAnimation();
                    }, 500);
                }
            }, 100);
        } else {
            setTimeout(() => {
                this.generateDiagram();
            }, 100);
        }

        this.showMessage(`${sampleType === 'default' ? '기본' : sampleType} 샘플을 로드했습니다.`, 'info');
    }

    /**
     * Toggle connection labels visibility
     */
    toggleLabels(show) {
        this.settings.showLabels = show;
        
        const labels = this.canvas.connectionsGroup.querySelectorAll('.connection-label');
        labels.forEach(label => {
            label.style.display = show ? 'block' : 'none';
        });
    }

    /**
     * Update button states based on current state
     */
    updateButtonStates() {
        const generateBtn = document.getElementById('generate-btn');
        const animateBtn = document.getElementById('animate-btn');
        const resetBtn = document.getElementById('reset-btn');

        const hasValidInput = document.getElementById('plantuml-input').value.trim();
        const hasDiagram = this.currentDiagram && this.currentDiagram.objects.length > 0;
        const isAnimating = this.animator.isAnimating;

        generateBtn.disabled = !hasValidInput || isAnimating;
        animateBtn.disabled = !hasDiagram || isAnimating;
        resetBtn.disabled = isAnimating;

        // Update button text based on state
        if (isAnimating) {
            animateBtn.textContent = '⏹️ 애니메이션 중지';
            animateBtn.onclick = () => this.animator.stopAnimation();
        } else {
            animateBtn.textContent = '▶️ 흐름 애니메이션';
            animateBtn.onclick = () => this.startFullAnimation();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        if (!this.isInitialized) return;

        // Recalculate canvas dimensions if needed
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        
        // Update canvas viewBox if necessary
        this.canvas.setCanvasDimensions(800, Math.max(400, rect.height));
        
        // Re-render if we have a diagram
        if (this.currentDiagram) {
            this.canvas.render(this.currentDiagram);
        }
    }

    /**
     * Show user message
     */
    showMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.querySelector('.app-message');
        
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'app-message';
            document.querySelector('.container').insertBefore(
                messageEl, 
                document.querySelector('.main-content')
            );
        }

        messageEl.className = `app-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.display = 'block';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl) {
                messageEl.style.display = 'none';
            }
        }, 3000);
    }

    /**
     * Get application statistics
     */
    getStats() {
        return {
            app: {
                initialized: this.isInitialized,
                hasDiagram: !!this.currentDiagram
            },
            diagram: this.currentDiagram ? {
                objects: this.currentDiagram.objects.length,
                connections: this.currentDiagram.connections.length
            } : null,
            animation: this.animator.getStats()
        };
    }

    /**
     * Export diagram data
     */
    exportDiagram() {
        if (!this.currentDiagram) {
            this.showMessage('내보낼 다이어그램이 없습니다.', 'warning');
            return null;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            plantumlSource: document.getElementById('plantuml-input').value,
            diagram: this.currentDiagram,
            settings: {
                animationSpeed: this.animator.animationSpeed
            }
        };

        return exportData;
    }

    /**
     * Import diagram data
     */
    importDiagram(importData) {
        try {
            if (importData.plantumlSource) {
                document.getElementById('plantuml-input').value = importData.plantumlSource;
            }

            if (importData.settings && importData.settings.animationSpeed) {
                this.animator.setSpeed(importData.settings.animationSpeed);
                document.getElementById('animation-speed').value = importData.settings.animationSpeed;
                document.getElementById('speed-value').textContent = 
                    `${importData.settings.animationSpeed.toFixed(1)}x`;
            }

            this.generateDiagram();
            this.showMessage('다이어그램을 성공적으로 가져왔습니다.', 'success');

        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('가져오기 중 오류가 발생했습니다.', 'error');
        }
    }

    /**
     * Adjust animation speed by delta
     */
    adjustAnimationSpeed(delta) {
        const speedSlider = document.getElementById('animation-speed');
        const speedValue = document.getElementById('speed-value');
        
        const currentSpeed = parseFloat(speedSlider.value);
        const newSpeed = Math.max(0.5, Math.min(3.0, currentSpeed + delta));
        
        speedSlider.value = newSpeed;
        this.animator.setSpeed(newSpeed);
        speedValue.textContent = `${newSpeed.toFixed(1)}x`;
        
        this.showMessage(`애니메이션 속도: ${newSpeed.toFixed(1)}x`, 'info');
    }

    /**
     * Load sample by number (1-4)
     */
    loadSampleByNumber(number) {
        const sampleTypes = ['default', 'simple', 'ecommerce', 'microservice'];
        const sampleSelect = document.getElementById('sample-select');
        
        if (number >= 1 && number <= 4) {
            const sampleType = sampleTypes[number - 1];
            sampleSelect.value = sampleType;
            this.loadSelectedSample(sampleType);
        }
    }

    /**
     * Focus next object for accessibility
     */
    focusNextObject() {
        const objects = this.canvas.objectsGroup.querySelectorAll('.uml-object');
        if (objects.length === 0) return;

        // Find currently focused object or start from beginning
        let currentIndex = -1;
        objects.forEach((obj, index) => {
            if (obj.classList.contains('focused')) {
                currentIndex = index;
            }
        });

        // Remove current focus
        objects.forEach(obj => obj.classList.remove('focused'));

        // Focus next object
        const nextIndex = (currentIndex + 1) % objects.length;
        const nextObject = objects[nextIndex];
        nextObject.classList.add('focused');

        // Announce to screen readers
        const objectId = nextObject.getAttribute('data-id');
        this.announceToScreenReader(`포커스: ${objectId} 객체`);
    }

    /**
     * Show help dialog
     */
    showHelp() {
        const helpContent = `
🎯 Interactive Animated PlantUML - 도움말

⌨️ 키보드 단축키:
• Ctrl/Cmd + Enter: 다이어그램 생성
• Ctrl/Cmd + Space: 전체 애니메이션 실행
• Ctrl/Cmd + R: 다이어그램 리셋
• Ctrl/Cmd + +/-: 애니메이션 속도 조절
• Ctrl/Cmd + 1-4: 샘플 선택
• Space: 애니메이션 실행
• Tab: 다음 객체로 포커스 이동
• Esc: 애니메이션 중지
• H or ?: 도움말 표시

🖱️ 마우스 조작:
• 객체 드래그: 위치 이동
• 객체 클릭: 해당 지점부터 애니메이션
• 빈 공간 클릭: 애니메이션 중지

🎨 기능:
• 실시간 드래그앤드롭
• 다양한 PlantUML 문법 지원
• 흐름 애니메이션
• 여러 샘플 예제
        `;

        alert(helpContent);
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        
        document.body.appendChild(announcement);
        announcement.textContent = message;
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting Animated PlantUML App...');
    window.app = new AnimatedPlantUMLApp();
});

// Add CSS for messages
const messageStyles = `
<style>
.app-message {
    margin: 10px 0;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 600;
    text-align: center;
    display: none;
    animation: slideIn 0.3s ease-out;
}

.app-message.success {
    background: rgba(243, 226, 212, 0.8);
    color: #17313E;
    border: 1px solid #C5B0CD;
}

.app-message.error {
    background: rgba(197, 176, 205, 0.3);
    color: #17313E;
    border: 1px solid #415E72;
}

.app-message.warning {
    background: rgba(243, 226, 212, 0.6);
    color: #415E72;
    border: 1px solid #C5B0CD;
}

.app-message.info {
    background: rgba(65, 94, 114, 0.1);
    color: #17313E;
    border: 1px solid #415E72;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', messageStyles);