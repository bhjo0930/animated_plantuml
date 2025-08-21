/**
 * PlantUML Parser - Extract objects and relationships from PlantUML text
 */
class PlantUMLParser {
    constructor() {
        this.objects = new Map();
        this.connections = [];
        this.objectTypes = {
            ACTOR: 'actor',
            ENTITY: 'entity',
            BOUNDARY: 'boundary',
            CONTROL: 'control',
            DATABASE: 'database',
            PARTICIPANT: 'participant'
        };
    }

    /**
     * Parse PlantUML text and extract diagram elements
     */
    parse(plantumlText) {
        this.reset();
        
        const lines = plantumlText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('@') && !line.startsWith("'"));

        // First pass: identify objects
        lines.forEach(line => this.parseObjectDefinition(line));
        
        // Second pass: identify connections
        lines.forEach(line => this.parseConnection(line));

        return {
            objects: Array.from(this.objects.values()),
            connections: this.connections
        };
    }

    reset() {
        this.objects.clear();
        this.connections = [];
    }

    /**
     * Parse object definitions (actors, participants, entities)
     */
    parseObjectDefinition(line) {
        // Enhanced pattern matching for various object types
        const patterns = [
            { regex: /^actor\s+"?([^"]+)"?\s+as\s+(\w+)|^actor\s+(\w+)/, type: this.objectTypes.ACTOR },
            { regex: /^participant\s+"?([^"]+)"?\s+as\s+(\w+)|^participant\s+(\w+)/, type: this.objectTypes.PARTICIPANT },
            { regex: /^entity\s+"?([^"]+)"?\s+as\s+(\w+)|^entity\s+(\w+)/, type: this.objectTypes.ENTITY },
            { regex: /^database\s+"?([^"]+)"?\s+as\s+(\w+)|^database\s+(\w+)/, type: this.objectTypes.DATABASE },
            { regex: /^boundary\s+"?([^"]+)"?\s+as\s+(\w+)|^boundary\s+(\w+)/, type: this.objectTypes.BOUNDARY },
            { regex: /^control\s+"?([^"]+)"?\s+as\s+(\w+)|^control\s+(\w+)/, type: this.objectTypes.CONTROL },
            // Support for collections and other types
            { regex: /^collections\s+"?([^"]+)"?\s+as\s+(\w+)|^collections\s+(\w+)/, type: 'collections' },
            { regex: /^queue\s+"?([^"]+)"?\s+as\s+(\w+)|^queue\s+(\w+)/, type: 'queue' }
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern.regex);
            if (match) {
                const name = match[1] || match[3];
                const id = match[2] || match[3];
                this.addObject(id, name, pattern.type);
                return;
            }
        }

        // Extract objects from connection lines with enhanced pattern matching
        const connectionPatterns = [
            /(\w+|\S+)\s*(->|-->|<-|<--|->>|<<-|\.\.>|\.\.|<\.\.|\.\.\.|<\.\.\.|\\\\|\||o\||\||o)\s*(\w+|\S+)\s*:\s*(.*)/,
            /(\w+|\S+)\s*(->|-->|<-|<--|->>|<<-)\s*(\w+|\S+)$/,
            // Support for activate/deactivate
            /^activate\s+(\w+)/, 
            /^deactivate\s+(\w+)/
        ];

        for (const pattern of connectionPatterns) {
            const match = line.match(pattern);
            if (match && match[1] && match[3]) {
                this.addObject(match[1], match[1], this.objectTypes.PARTICIPANT);
                this.addObject(match[3], match[3], this.objectTypes.PARTICIPANT);
                return;
            } else if (match && match[1] && !match[3]) {
                // For activate/deactivate commands
                this.addObject(match[1], match[1], this.objectTypes.PARTICIPANT);
                return;
            }
        }

        // Support for note definitions
        const noteMatch = line.match(/^note\s+(left|right|over)\s+(\w+)\s*:\s*(.*)|^note\s+(left|right)\s*:\s*(.*)/);
        if (noteMatch) {
            if (noteMatch[2]) {
                this.addObject(noteMatch[2], noteMatch[2], this.objectTypes.PARTICIPANT);
            }
        }
    }

    /**
     * Parse connections between objects
     */
    parseConnection(line) {
        // Enhanced pattern matching for various arrow types and connection styles
        const connectionPatterns = [
            // Basic arrows
            { regex: /(\w+|\S+)\s*(->)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'solid' },
            { regex: /(\w+|\S+)\s*(-->)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'dashed' },
            { regex: /(\w+|\S+)\s*(<-)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'reverse_solid', reverse: true },
            { regex: /(\w+|\S+)\s*(<--)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'reverse_dashed', reverse: true },
            { regex: /(\w+|\S+)\s*(->>)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'double' },
            { regex: /(\w+|\S+)\s*(<<-)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'reverse_double', reverse: true },
            
            // Dotted connections
            { regex: /(\w+|\S+)\s*(\.\.>)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'dotted' },
            { regex: /(\w+|\S+)\s*(<\.\.)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'reverse_dotted', reverse: true },
            { regex: /(\w+|\S+)\s*(\.\.\.)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'dotted_line' },
            
            // Special connections
            { regex: /(\w+|\S+)\s*(\\\\)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'break' },
            { regex: /(\w+|\S+)\s*(\|\|)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'parallel' },
            { regex: /(\w+|\S+)\s*(o\|)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'circle_start' },
            { regex: /(\w+|\S+)\s*(\|o)\s*(\w+|\S+)\s*:\s*(.*)/, type: 'circle_end' },
            
            // Arrows without labels
            { regex: /(\w+|\S+)\s*(->)\s*(\w+|\S+)$/, type: 'solid', label: '' },
            { regex: /(\w+|\S+)\s*(-->)\s*(\w+|\S+)$/, type: 'dashed', label: '' },
            { regex: /(\w+|\S+)\s*(<-)\s*(\w+|\S+)$/, type: 'reverse_solid', reverse: true, label: '' },
            { regex: /(\w+|\S+)\s*(<--)\s*(\w+|\S+)$/, type: 'reverse_dashed', reverse: true, label: '' }
        ];

        for (const pattern of connectionPatterns) {
            const match = line.match(pattern.regex);
            if (match) {
                const [, fromId, arrow, toId, label] = match;
                
                // Handle reverse arrows
                let actualFrom = fromId;
                let actualTo = toId;
                if (pattern.reverse) {
                    actualFrom = toId;
                    actualTo = fromId;
                }

                this.addConnection(actualFrom, actualTo, (label || pattern.label || '').trim(), arrow, pattern.type);
                return;
            }
        }

        // Handle special commands like activate/deactivate
        const activateMatch = line.match(/^(activate|deactivate)\s+(\w+)/);
        if (activateMatch) {
            // Store activation commands for potential use in animations
            this.connections.push({
                id: `command-${this.connections.length}`,
                type: 'command',
                command: activateMatch[1],
                target: activateMatch[2],
                from: null,
                to: null,
                label: `${activateMatch[1]} ${activateMatch[2]}`,
                arrowType: 'command',
                style: { strokeWidth: 1, strokeDasharray: 'none' }
            });
        }
    }

    /**
     * Add object to the objects map
     */
    addObject(id, name, type = this.objectTypes.PARTICIPANT) {
        if (!this.objects.has(id)) {
            this.objects.set(id, {
                id,
                name: name || id,
                type,
                x: 0,
                y: 0,
                width: Math.max(name.length * 8 + 40, 120),
                height: 60
            });
        }
    }

    /**
     * Add connection between objects
     */
    addConnection(fromId, toId, label = '', arrowType = '->', connectionType = 'solid') {
        // Ensure both objects exist
        this.addObject(fromId, fromId);
        this.addObject(toId, toId);

        this.connections.push({
            id: `${fromId}-${toId}-${this.connections.length}`,
            from: fromId,
            to: toId,
            label,
            arrowType,
            connectionType,
            style: this.getArrowStyle(arrowType, connectionType)
        });
    }

    /**
     * Get arrow style based on type and connection type
     */
    getArrowStyle(arrowType, connectionType = 'solid') {
        const baseStyle = { strokeWidth: 2, strokeDasharray: 'none' };
        
        // Style based on arrow type
        switch (arrowType) {
            case '-->':
            case '<--':
                baseStyle.strokeDasharray = '5,5';
                break;
            case '->>':
            case '<<-':
                baseStyle.strokeWidth = 3;
                break;
            case '..>':
            case '<..':
                baseStyle.strokeDasharray = '2,3';
                baseStyle.strokeWidth = 1.5;
                break;
            case '...':
                baseStyle.strokeDasharray = '1,2';
                baseStyle.strokeWidth = 1;
                break;
            case '\\\\':
                baseStyle.strokeDasharray = '10,5';
                baseStyle.strokeWidth = 2.5;
                break;
            case '||':
                baseStyle.strokeWidth = 4;
                break;
        }
        
        // Additional styling based on connection type
        switch (connectionType) {
            case 'dashed':
                baseStyle.strokeDasharray = '5,5';
                break;
            case 'dotted':
                baseStyle.strokeDasharray = '2,3';
                baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 0.8, 1);
                break;
            case 'dotted_line':
                baseStyle.strokeDasharray = '1,2';
                baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 0.6, 1);
                break;
            case 'double':
                baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 1.5, 3);
                break;
            case 'break':
                baseStyle.strokeDasharray = '10,5';
                baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 1.2, 2.5);
                break;
            case 'parallel':
                baseStyle.strokeWidth = Math.max(baseStyle.strokeWidth * 2, 4);
                break;
        }
        
        return baseStyle;
    }

    /**
     * Auto-layout objects in a grid or flow pattern
     */
    autoLayout(objects, canvasWidth = 800, canvasHeight = 600) {
        const padding = 50;
        const usableWidth = canvasWidth - (padding * 2);
        const usableHeight = canvasHeight - (padding * 2);

        if (objects.length === 0) return objects;

        // Simple grid layout
        const cols = Math.ceil(Math.sqrt(objects.length));
        const rows = Math.ceil(objects.length / cols);
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;

        objects.forEach((obj, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            obj.x = padding + (col * cellWidth) + (cellWidth / 2) - (obj.width / 2);
            obj.y = padding + (row * cellHeight) + (cellHeight / 2) - (obj.height / 2);
            
            // Ensure objects stay within bounds
            obj.x = Math.max(padding, Math.min(obj.x, canvasWidth - obj.width - padding));
            obj.y = Math.max(padding, Math.min(obj.y, canvasHeight - obj.height - padding));
        });

        return objects;
    }

    /**
     * Generate sample PlantUML for demonstration
     */
    static getSampleDiagram() {
        return `@startuml
actor "고객" as Customer
participant "웹 애플리케이션" as WebApp
participant "API 게이트웨이" as Gateway
participant "인증 서비스" as AuthService
database "사용자 DB" as UserDB
participant "주문 서비스" as OrderService
database "주문 DB" as OrderDB
participant "결제 서비스" as PaymentService
participant "알림 서비스" as NotificationService

Customer -> WebApp: 로그인 요청
WebApp -> Gateway: 인증 API 호출
Gateway -> AuthService: 사용자 검증
AuthService -> UserDB: 사용자 정보 조회
UserDB --> AuthService: 사용자 데이터
AuthService --> Gateway: 인증 토큰
Gateway --> WebApp: 로그인 성공
WebApp --> Customer: 대시보드 표시

Customer -> WebApp: 상품 주문
WebApp -> Gateway: 주문 생성 API
Gateway -> OrderService: 주문 처리
OrderService -> OrderDB: 주문 정보 저장
OrderDB --> OrderService: 저장 완료
OrderService -> PaymentService: 결제 처리 요청
PaymentService --> OrderService: 결제 완료
OrderService -> NotificationService: 주문 완료 알림
NotificationService --> Customer: 이메일/SMS 발송
OrderService --> Gateway: 주문 완료 응답
Gateway --> WebApp: 성공 응답
WebApp --> Customer: 주문 완료 화면
@enduml`;
    }

    /**
     * Get enhanced sample diagrams with different styles
     */
    static getAdvancedSamples() {
        return {
            simple: `@startuml
Alice -> Bob: 안녕하세요!
Bob --> Alice: 반갑습니다
Alice ->> Bob: 메시지 전송
Bob ..> Alice: 읽음 표시
@enduml`,

            ecommerce: `@startuml
actor "고객" as Customer
participant "웹사이트" as Website
database "상품 DB" as ProductDB
participant "결제 시스템" as Payment
participant "배송 서비스" as Shipping

Customer -> Website: 상품 검색
Website -> ProductDB: 상품 정보 조회
ProductDB --> Website: 상품 리스트
Website --> Customer: 검색 결과

Customer -> Website: 장바구니 추가
Customer -> Website: 주문하기
Website -> Payment: 결제 처리
Payment --> Website: 결제 완료
Website -> Shipping: 배송 요청
Shipping --> Customer: 배송 시작 알림
@enduml`,

            microservice: `@startuml
participant "클라이언트" as Client
participant "API Gateway" as Gateway
participant "사용자 서비스" as UserService
participant "주문 서비스" as OrderService
participant "재고 서비스" as InventoryService
database "Redis 캐시" as Cache

Client -> Gateway: API 요청
Gateway -> UserService: 사용자 검증
UserService --> Gateway: 검증 완료

Gateway -> OrderService: 주문 생성
OrderService -> InventoryService: 재고 확인
InventoryService -> Cache: 캐시 조회
Cache --> InventoryService: 캐시된 데이터
InventoryService --> OrderService: 재고 확인 완료
OrderService --> Gateway: 주문 생성 완료
Gateway --> Client: 응답 반환
@enduml`
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlantUMLParser;
}