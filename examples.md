# 🎯 Interactive Animated PlantUML - 예제 모음

이 문서는 Interactive Animated PlantUML에서 지원하는 다양한 PlantUML 문법과 기능을 보여주는 예제들을 포함합니다.

## 🚀 기본 사용법

### 1. 간단한 시퀀스 다이어그램

```plantuml
@startuml
Alice -> Bob: 안녕하세요!
Bob --> Alice: 반갑습니다
Alice ->> Bob: 메시지 전송
Bob ..> Alice: 읽음 표시
@enduml
```

**설명**: 다양한 화살표 스타일을 보여주는 기본적인 예제입니다.

### 2. 참여자 정의가 있는 다이어그램

```plantuml
@startuml
participant "사용자" as User
actor "관리자" as Admin
database "데이터베이스" as DB
entity "파일 시스템" as FS

User -> Admin: 권한 요청
Admin -> DB: 사용자 정보 확인
DB --> Admin: 사용자 데이터
Admin -> FS: 로그 기록
FS --> Admin: 기록 완료
Admin --> User: 권한 승인
@enduml
```

**설명**: 다양한 객체 타입(participant, actor, database, entity)을 사용한 예제입니다.

## 🏢 실무 예제

### 3. 전자상거래 주문 프로세스

```plantuml
@startuml
actor "고객" as Customer
participant "웹사이트" as Website
participant "재고 관리" as Inventory
database "상품 DB" as ProductDB
participant "결제 시스템" as Payment
participant "배송 서비스" as Shipping
participant "알림 시스템" as Notification

== 상품 검색 및 선택 ==
Customer -> Website: 상품 검색
Website -> ProductDB: 상품 정보 조회
ProductDB --> Website: 상품 리스트
Website --> Customer: 검색 결과 표시

Customer -> Website: 상품 선택
Website -> Inventory: 재고 확인
Inventory --> Website: 재고 상태
Website --> Customer: 상품 상세 정보

== 주문 처리 ==
Customer -> Website: 장바구니 담기
Customer -> Website: 주문하기
Website -> Payment: 결제 처리
Payment --> Website: 결제 승인

Website -> Inventory: 재고 차감
Inventory --> Website: 재고 업데이트 완료

Website -> Shipping: 배송 요청
Shipping --> Website: 배송 접수 완료

== 알림 및 완료 ==
Website -> Notification: 주문 완료 알림
Notification --> Customer: 이메일 발송
Shipping --> Customer: 배송 시작 SMS
Website --> Customer: 주문 완료 화면
@enduml
```

### 4. 마이크로서비스 아키텍처

```plantuml
@startuml
participant "모바일 앱" as Mobile
participant "웹 클라이언트" as Web
participant "API Gateway" as Gateway
participant "인증 서비스" as AuthService
participant "사용자 서비스" as UserService
participant "주문 서비스" as OrderService
participant "상품 서비스" as ProductService
participant "결제 서비스" as PaymentService
database "사용자 DB" as UserDB
database "주문 DB" as OrderDB
database "상품 DB" as ProductDB
participant "메시지 큐" as MessageQueue
participant "로그 서비스" as LogService

== 사용자 인증 ==
Mobile -> Gateway: 로그인 요청
Gateway -> AuthService: 토큰 검증
AuthService -> UserDB: 사용자 정보 확인
UserDB --> AuthService: 사용자 데이터
AuthService --> Gateway: 인증 성공
Gateway --> Mobile: 액세스 토큰

== 상품 조회 ==
Web -> Gateway: 상품 목록 요청
Gateway -> ProductService: 상품 데이터 조회
ProductService -> ProductDB: 상품 정보 쿼리
ProductDB --> ProductService: 상품 리스트
ProductService --> Gateway: 상품 데이터
Gateway --> Web: JSON 응답

== 주문 생성 ==
Mobile -> Gateway: 주문 생성 요청
Gateway -> OrderService: 주문 처리
OrderService -> ProductService: 상품 정보 확인
ProductService --> OrderService: 상품 세부 정보

OrderService -> PaymentService: 결제 처리
PaymentService --> OrderService: 결제 완료

OrderService -> OrderDB: 주문 저장
OrderDB --> OrderService: 저장 완료

OrderService -> MessageQueue: 주문 완료 이벤트
MessageQueue -> LogService: 로그 기록
LogService --> MessageQueue: 기록 완료

OrderService --> Gateway: 주문 생성 완료
Gateway --> Mobile: 주문 확인
@enduml
```

## 🎨 고급 문법 예제

### 5. 다양한 화살표 스타일

```plantuml
@startuml
participant A
participant B
participant C

A -> B: 일반 화살표
A --> B: 점선 화살표
A ->> B: 굵은 화살표
A ..> B: 점선 양방향
A <- B: 역방향 화살표
A <-- B: 점선 역방향
A <<- B: 굵은 역방향

note right of A: 실선 화살표는\n동기 호출을 나타냄

note left of B: 점선 화살표는\n응답을 나타냄

note over C: 굵은 화살표는\n비동기 호출을 나타냄
@enduml
```

### 6. 그룹화와 분할

```plantuml
@startuml
actor User
participant "웹 서버" as Web
participant "API 서버" as API
database "DB" as Database

== 인증 단계 ==
User -> Web: 로그인 요청
Web -> API: 인증 API 호출
API -> Database: 사용자 검증
Database --> API: 검증 결과
API --> Web: 인증 토큰
Web --> User: 로그인 성공

== 데이터 조회 단계 ==
User -> Web: 데이터 요청
Web -> API: 데이터 API 호출

group 병렬 처리
    API -> Database: 기본 정보 조회
    API -> Database: 상세 정보 조회
    Database --> API: 기본 데이터
    Database --> API: 상세 데이터
end

API --> Web: 통합 데이터
Web --> User: 화면 표시

== 에러 처리 ==
alt 성공적인 처리
    User -> Web: 정상 요청
    Web --> User: 정상 응답
else 에러 발생
    User -> Web: 잘못된 요청
    Web --> User: 에러 메시지
end
@enduml
```

### 7. 생명주기와 활성화

```plantuml
@startuml
participant User
participant "Controller" as Ctrl
participant "Service" as Svc
participant "Repository" as Repo

User -> Ctrl: 요청
activate Ctrl

Ctrl -> Svc: 서비스 호출
activate Svc

Svc -> Repo: 데이터 조회
activate Repo
Repo --> Svc: 데이터 반환
deactivate Repo

Svc --> Ctrl: 처리 결과
deactivate Svc

Ctrl --> User: 응답
deactivate Ctrl
@enduml
```

### 8. 컬렉션과 큐

```plantuml
@startuml
collections "로드 밸런서" as LB
participant "웹 서버 1" as Web1
participant "웹 서버 2" as Web2
queue "메시지 큐" as Queue
participant "워커 1" as Worker1
participant "워커 2" as Worker2
database "공유 DB" as SharedDB

== 요청 분산 ==
LB -> Web1: 요청 1
LB -> Web2: 요청 2

== 비동기 처리 ==
Web1 -> Queue: 작업 큐에 추가
Web2 -> Queue: 작업 큐에 추가

Queue -> Worker1: 작업 1 처리
Queue -> Worker2: 작업 2 처리

Worker1 -> SharedDB: 데이터 저장
Worker2 -> SharedDB: 데이터 저장

SharedDB --> Worker1: 저장 완료
SharedDB --> Worker2: 저장 완료
@enduml
```

## 🛠️ 특수 기능 예제

### 9. 노트와 주석

```plantuml
@startuml
participant "클라이언트" as Client
participant "서버" as Server
database "DB" as Database

note left of Client: 사용자 입력을\n받는 부분

Client -> Server: 데이터 요청
note over Server: 요청 검증 및\n전처리 수행

Server -> Database: 쿼리 실행
note right of Database
  - 인덱스 사용
  - 최적화된 쿼리
  - 캐시 확인
end note

Database --> Server: 결과 반환
Server --> Client: JSON 응답

note over Client, Server: 전체 프로세스\n완료
@enduml
```

### 10. 조건문과 반복문

```plantuml
@startuml
actor User
participant System
database Cache
database Database

User -> System: 데이터 요청

alt 캐시에 데이터 존재
    System -> Cache: 캐시 조회
    Cache --> System: 캐시된 데이터
    System --> User: 빠른 응답
else 캐시에 데이터 없음
    System -> Database: DB 조회
    Database --> System: 원본 데이터
    System -> Cache: 캐시 저장
    System --> User: 데이터 반환
end

loop 배치 처리
    System -> Database: 배치 작업 실행
    Database --> System: 처리 결과
end
@enduml
```

## 🎯 애니메이션 최적화 팁

### 11. 애니메이션 흐름 최적화 예제

```plantuml
@startuml
participant "A" as A
participant "B" as B
participant "C" as C
participant "D" as D

== 순차적 흐름 (애니메이션 효과 좋음) ==
A -> B: 1단계
B -> C: 2단계
C -> D: 3단계
D --> A: 완료

== 병렬 흐름 (동시 애니메이션) ==
A -> B: 병렬 작업 1
A -> C: 병렬 작업 2
A -> D: 병렬 작업 3

B --> A: 결과 1
C --> A: 결과 2
D --> A: 결과 3
@enduml
```

## 📱 모바일 최적화 예제

### 12. 간결한 모바일용 다이어그램

```plantuml
@startuml
participant App
participant API
database DB

App -> API: 요청
API -> DB: 조회
DB --> API: 데이터
API --> App: 응답
@enduml
```

## 🎮 사용법 가이드

### 애니메이션 활용법:

1. **객체 클릭**: 특정 객체를 클릭하면 해당 지점부터 흐름 애니메이션이 시작됩니다.

2. **전체 애니메이션**: "흐름 애니메이션" 버튼을 클릭하면 전체 다이어그램의 흐름이 애니메이션됩니다.

3. **속도 조절**: 슬라이더로 애니메이션 속도를 0.5x ~ 3.0x로 조절할 수 있습니다.

4. **드래그 앤 드롭**: 모든 객체를 자유롭게 드래그하여 위치를 조정할 수 있습니다.

5. **키보드 단축키**: 
   - `Ctrl/Cmd + Enter`: 다이어그램 생성
   - `Ctrl/Cmd + Space`: 애니메이션 실행
   - `Ctrl/Cmd + R`: 리셋
   - `H` 또는 `?`: 도움말 표시

### 최적화된 PlantUML 작성 팁:

- 명확한 객체명 사용
- 적절한 화살표 스타일 선택
- 그룹화와 섹션 활용
- 노트로 추가 설명 제공
- 복잡한 다이어그램은 단계별로 분할

이 예제들을 참고하여 다양한 PlantUML 다이어그램을 생성하고 애니메이션 효과를 즐겨보세요! 🎉