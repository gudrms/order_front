# 🔗 OKPOS API 연동 가이드

## 📋 목차
1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [인증 방식](#3-인증-방식)
4. [Spring Boot 구현](#4-spring-boot-구현)
5. [주요 API 엔드포인트](#5-주요-api-엔드포인트)
6. [에러 처리 전략](#6-에러-처리-전략)
7. [데이터베이스 스키마](#7-데이터베이스-스키마)
8. [환경 설정](#8-환경-설정)
9. [테스트 방법](#9-테스트-방법)
10. [보안 고려사항](#10-보안-고려사항)

---

## 1. 개요

### 1.1 OKPOS O2O API
- **Base URL**: `https://dum.okpos.co.kr/api`
- **API Documentation**: `https://dum.okpos.co.kr/api/swagger-ui.html`
- **Protocol**: REST API (JSON)
- **인증 방식**: API Key (추정)

### 1.2 연동 목적
- **실시간 주문 전송**: 테이블오더에서 받은 주문을 OKPOS 단말기로 실시간 전송
- **메뉴 동기화**: OKPOS의 메뉴 정보를 테이블오더 시스템과 동기화
- **주문 상태 추적**: OKPOS에서 처리되는 주문 상태를 실시간으로 확인

### 1.3 연동 범위
| 기능 | 방향 | 설명 |
|:-----|:-----|:-----|
| 메뉴 조회 | OKPOS → 테이블오더 | 메뉴 정보 가져오기 (스케줄러) |
| 주문 생성 | 테이블오더 → OKPOS | 고객 주문 실시간 전송 |
| 주문 상태 조회 | OKPOS ← 테이블오더 | 주문 처리 상태 확인 |
| 결제 정보 | 양방향 | 결제 완료 시 동기화 |

---

## 2. 시스템 아키텍처

```
┌─────────────────────┐
│  고객 (테이블 태블릿)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Next.js Frontend  │
└──────────┬──────────┘
           │ HTTP/WebSocket
           ▼
┌─────────────────────┐       ┌──────────────────┐
│  Spring Boot API    │◄─────►│  OKPOS O2O API   │
│  (테이블오더 백엔드)   │       │ dum.okpos.co.kr  │
└──────────┬──────────┘       └────────┬─────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐       ┌──────────────────┐
│   PostgreSQL DB     │       │  OKPOS 단말기     │
│  (주문/메뉴 로컬 저장) │       │  (POS 프로그램)   │
└─────────────────────┘       └──────────────────┘
```

### 2.1 데이터 흐름 (주문 생성 시)
```
1. 고객 주문 (Next.js) 
   ↓
2. POST /api/v1/orders (Spring Boot)
   ↓
3. DB 저장 (PostgreSQL)
   ↓
4. OKPOS API 호출 (POST /api/order/create)
   ↓
5. 성공 시: okpos_order_id 업데이트
   실패 시: 재시도 큐 추가 또는 알림
   ↓
6. WebSocket으로 주방/고객에게 알림
```

---

## 3. 인증 방식

### 3.1 API Key 인증 (추정)
OKPOS API는 HTTP Header에 API Key를 포함하여 인증합니다.

**Request Header 예시:**
```http
POST /api/order/create HTTP/1.1
Host: dum.okpos.co.kr
Content-Type: application/json
X-API-KEY: your-api-key-here
```

또는

```http
Authorization: Bearer your-api-key-here
```

### 3.2 API Key 발급 방법
1. OKPOS 파트너 센터 또는 담당자에게 문의
2. 매장 정보 등록 후 API Key 발급
3. 환경변수에 안전하게 저장 (`application-prod.yml` 또는 NCP Secrets Manager)

---

## 4. Spring Boot 구현

### 4.1 프로젝트 구조
```
src/main/java/com/tableorder/
├── okpos/
│   ├── config/
│   │   ├── OkposApiConfig.java          # RestTemplate 설정
│   │   └── OkposProperties.java         # application.yml 매핑
│   ├── client/
│   │   ├── OkposApiClient.java          # API 호출 클라이언트
│   │   └── OkposApiInterceptor.java     # 인증 헤더 추가
│   ├── service/
│   │   ├── OkposOrderService.java       # 주문 전송 로직
│   │   └── OkposMenuSyncService.java    # 메뉴 동기화 로직
│   ├── dto/
│   │   ├── request/
│   │   │   ├── OkposOrderRequest.java
│   │   │   └── OkposMenuRequest.java
│   │   └── response/
│   │       ├── OkposOrderResponse.java
│   │       └── OkposMenuResponse.java
│   ├── exception/
│   │   ├── OkposApiException.java
│   │   └── OkposRetryableException.java
│   ├── scheduler/
│   │   └── OkposMenuSyncScheduler.java  # 메뉴 동기화 스케줄러
│   └── entity/
│       └── OkposSyncLog.java            # 연동 로그 엔티티
```

### 4.2 의존성 추가 (build.gradle)
```gradle
dependencies {
    // 기존 의존성...
    
    // HTTP Client
    implementation 'org.springframework.boot:spring-boot-starter-web'
    
    // Retry & Circuit Breaker
    implementation 'org.springframework.retry:spring-retry'
    implementation 'io.github.resilience4j:resilience4j-spring-boot3:2.1.0'
    
    // JSON 처리
    implementation 'com.fasterxml.jackson.core:jackson-databind'
    
    // 로깅
    implementation 'net.logstash.logback:logstash-logback-encoder:7.4'
}
```

### 4.3 핵심 클래스 구현

#### 4.3.1 OkposProperties.java
```java
package com.tableorder.okpos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "okpos.api")
public class OkposProperties {
    private String baseUrl;
    private String apiKey;
    private Integer timeout;
    private Retry retry;
    
    @Getter
    @Setter
    public static class Retry {
        private Integer maxAttempts;
        private Long delay;
    }
}
```

#### 4.3.2 OkposApiConfig.java
```java
package com.tableorder.okpos.config;

import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Collections;

@Configuration
@EnableRetry
public class OkposApiConfig {
    
    private final OkposProperties okposProperties;
    
    public OkposApiConfig(OkposProperties okposProperties) {
        this.okposProperties = okposProperties;
    }
    
    @Bean(name = "okposRestTemplate")
    public RestTemplate okposRestTemplate(RestTemplateBuilder builder) {
        return builder
            .rootUri(okposProperties.getBaseUrl())
            .setConnectTimeout(Duration.ofMillis(okposProperties.getTimeout()))
            .setReadTimeout(Duration.ofMillis(okposProperties.getTimeout()))
            .interceptors(Collections.singletonList(okposApiInterceptor()))
            .build();
    }
    
    @Bean
    public ClientHttpRequestInterceptor okposApiInterceptor() {
        return (request, body, execution) -> {
            request.getHeaders().set("X-API-KEY", okposProperties.getApiKey());
            request.getHeaders().set("Content-Type", "application/json");
            return execution.execute(request, body);
        };
    }
}
```

#### 4.3.3 OkposApiClient.java
```java
package com.tableorder.okpos.client;

import com.tableorder.okpos.dto.request.OkposOrderRequest;
import com.tableorder.okpos.dto.response.OkposOrderResponse;
import com.tableorder.okpos.dto.response.OkposMenuResponse;
import com.tableorder.okpos.exception.OkposApiException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Component
@RequiredArgsConstructor
public class OkposApiClient {
    
    @Qualifier("okposRestTemplate")
    private final RestTemplate restTemplate;
    
    /**
     * OKPOS에 주문 생성
     */
    public OkposOrderResponse createOrder(OkposOrderRequest request) {
        String url = "/order/create";
        
        try {
            log.info("OKPOS 주문 생성 요청: {}", request);
            
            ResponseEntity<OkposOrderResponse> response = restTemplate.postForEntity(
                url,
                request,
                OkposOrderResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("OKPOS 주문 생성 성공: {}", response.getBody());
                return response.getBody();
            }
            
            throw new OkposApiException("OKPOS 주문 생성 실패: 응답이 비어있음");
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("OKPOS API 에러: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new OkposApiException("OKPOS API 호출 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * OKPOS에서 메뉴 목록 조회
     */
    public OkposMenuResponse getMenuList(String storeId) {
        String url = "/menu/items?storeId=" + storeId;
        
        try {
            log.info("OKPOS 메뉴 조회 요청: storeId={}", storeId);
            
            ResponseEntity<OkposMenuResponse> response = restTemplate.getForEntity(
                url,
                OkposMenuResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("OKPOS 메뉴 조회 성공: {} 건", response.getBody().getItems().size());
                return response.getBody();
            }
            
            throw new OkposApiException("OKPOS 메뉴 조회 실패");
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.error("OKPOS 메뉴 조회 에러: {}", e.getMessage());
            throw new OkposApiException("OKPOS 메뉴 조회 실패: " + e.getMessage(), e);
        }
    }
    
    /**
     * 주문 상태 조회
     */
    public OkposOrderResponse getOrderStatus(String okposOrderId) {
        String url = "/order/" + okposOrderId;
        
        try {
            ResponseEntity<OkposOrderResponse> response = restTemplate.getForEntity(
                url,
                OkposOrderResponse.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody();
            }
            
            throw new OkposApiException("OKPOS 주문 상태 조회 실패");
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            throw new OkposApiException("OKPOS 주문 상태 조회 실패: " + e.getMessage(), e);
        }
    }
}
```

#### 4.3.4 OkposOrderService.java
```java
package com.tableorder.okpos.service;

import com.tableorder.entity.Order;
import com.tableorder.entity.OrderItem;
import com.tableorder.okpos.client.OkposApiClient;
import com.tableorder.okpos.dto.request.OkposOrderRequest;
import com.tableorder.okpos.dto.request.OkposOrderItemRequest;
import com.tableorder.okpos.dto.response.OkposOrderResponse;
import com.tableorder.okpos.exception.OkposApiException;
import com.tableorder.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OkposOrderService {
    
    private final OkposApiClient okposApiClient;
    private final OrderRepository orderRepository;
    
    /**
     * 주문을 OKPOS로 전송
     * 재시도: 최대 3번, 2초 간격으로 지수 백오프
     */
    @Transactional
    @Retryable(
        value = {OkposApiException.class},
        maxAttempts = 3,
        backoff = @Backoff(delay = 2000, multiplier = 2)
    )
    public void sendOrderToOkpos(Order order) {
        try {
            log.info("OKPOS 주문 전송 시작: orderId={}", order.getId());
            
            // Order 엔티티를 OKPOS API 요청 형식으로 변환
            OkposOrderRequest request = convertToOkposRequest(order);
            
            // OKPOS API 호출
            OkposOrderResponse response = okposApiClient.createOrder(request);
            
            // 성공 시 OKPOS 주문 ID 저장
            if (response.isSuccess()) {
                order.setOkposOrderId(response.getOkposOrderId());
                orderRepository.save(order);
                log.info("OKPOS 주문 전송 성공: orderId={}, okposOrderId={}", 
                    order.getId(), response.getOkposOrderId());
            } else {
                throw new OkposApiException("OKPOS 주문 생성 실패: " + response.getErrorMessage());
            }
            
        } catch (OkposApiException e) {
            log.error("OKPOS 주문 전송 실패: orderId={}, error={}", order.getId(), e.getMessage());
            // 재시도 가능한 예외는 던져서 @Retryable이 처리하도록 함
            throw e;
        }
    }
    
    /**
     * Order 엔티티를 OKPOS API 요청 형식으로 변환
     */
    private OkposOrderRequest convertToOkposRequest(Order order) {
        List<OkposOrderItemRequest> items = order.getOrderItems().stream()
            .map(this::convertToOkposItem)
            .collect(Collectors.toList());
        
        return OkposOrderRequest.builder()
            .storeId(order.getTable().getStore().getId().toString())
            .tableNumber(order.getTable().getTableNumber())
            .items(items)
            .totalPrice(order.getTotalPrice())
            .build();
    }
    
    private OkposOrderItemRequest convertToOkposItem(OrderItem item) {
        return OkposOrderItemRequest.builder()
            .menuId(item.getMenu().getId().toString())
            .menuName(item.getMenuName())
            .quantity(item.getQuantity())
            .price(item.getMenuPrice())
            .options(item.getOptions()) // JSON 문자열
            .build();
    }
}
```

#### 4.3.5 DTO 클래스들

**OkposOrderRequest.java**
```java
package com.tableorder.okpos.dto.request;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class OkposOrderRequest {
    private String storeId;
    private String tableNumber;
    private List<OkposOrderItemRequest> items;
    private Integer totalPrice;
}
```

**OkposOrderItemRequest.java**
```java
package com.tableorder.okpos.dto.request;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class OkposOrderItemRequest {
    private String menuId;
    private String menuName;
    private Integer quantity;
    private Integer price;
    private String options; // JSON 문자열
}
```

**OkposOrderResponse.java**
```java
package com.tableorder.okpos.dto.response;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OkposOrderResponse {
    private Boolean success;
    private String okposOrderId;
    private String status;
    private String errorMessage;
    
    public boolean isSuccess() {
        return success != null && success;
    }
}
```

**OkposMenuResponse.java**
```java
package com.tableorder.okpos.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class OkposMenuResponse {
    private Boolean success;
    private List<OkposMenuItem> items;
    
    @Getter
    @Setter
    public static class OkposMenuItem {
        private String menuId;
        private String categoryId;
        private String name;
        private String description;
        private Integer price;
        private String imageUrl;
        private Boolean isSoldOut;
    }
}
```

#### 4.3.6 Exception 클래스
```java
package com.tableorder.okpos.exception;

public class OkposApiException extends RuntimeException {
    
    public OkposApiException(String message) {
        super(message);
    }
    
    public OkposApiException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

---

## 5. 주요 API 엔드포인트

### 5.1 주문 생성 (핵심)
```http
POST /api/order/create
Content-Type: application/json
X-API-KEY: {your-api-key}

Request Body:
{
  "storeId": "store-uuid",
  "tableNumber": "5",
  "items": [
    {
      "menuId": "menu-uuid",
      "menuName": "김치찌개",
      "quantity": 2,
      "price": 8000,
      "options": "{\"spicy\": \"medium\", \"rice\": true}"
    }
  ],
  "totalPrice": 16000
}

Response:
{
  "success": true,
  "okposOrderId": "OKPOS-202412-001",
  "status": "PENDING"
}
```

### 5.2 메뉴 조회
```http
GET /api/menu/items?storeId={storeId}
X-API-KEY: {your-api-key}

Response:
{
  "success": true,
  "items": [
    {
      "menuId": "menu-001",
      "categoryId": "cat-001",
      "name": "김치찌개",
      "description": "얼큰한 김치찌개",
      "price": 8000,
      "imageUrl": "https://...",
      "isSoldOut": false
    }
  ]
}
```

### 5.3 주문 상태 조회
```http
GET /api/order/{okposOrderId}
X-API-KEY: {your-api-key}

Response:
{
  "success": true,
  "okposOrderId": "OKPOS-202412-001",
  "status": "COOKING", // PENDING, COOKING, SERVED, COMPLETED
  "updatedAt": "2024-12-26T14:30:00"
}
```

---

## 6. 에러 처리 전략

### 6.1 재시도 로직 (Spring Retry)
```java
@Retryable(
    value = {OkposApiException.class},
    maxAttempts = 3,
    backoff = @Backoff(delay = 2000, multiplier = 2)
)
```
- **재시도 횟수**: 최대 3번
- **지연 시간**: 2초 → 4초 → 8초 (지수 백오프)

### 6.2 Circuit Breaker (Resilience4j)
**application.yml**
```yaml
resilience4j:
  circuitbreaker:
    instances:
      okposApi:
        sliding-window-size: 10
        failure-rate-threshold: 50
        wait-duration-in-open-state: 60000
        permitted-number-of-calls-in-half-open-state: 3
```

**적용 예시:**
```java
@CircuitBreaker(name = "okposApi", fallbackMethod = "fallbackCreateOrder")
public OkposOrderResponse createOrder(OkposOrderRequest request) {
    return okposApiClient.createOrder(request);
}

private OkposOrderResponse fallbackCreateOrder(OkposOrderRequest request, Exception e) {
    log.error("OKPOS API Circuit Breaker 작동: {}", e.getMessage());
    // 실패 주문을 별도 큐에 저장
    saveFailedOrder(request);
    throw new OkposApiException("OKPOS 서비스 일시적 장애");
}
```

### 6.3 실패한 주문 처리
```java
@Entity
public class FailedOkposOrder {
    @Id
    private UUID id;
    private UUID orderId;
    private String requestJson;
    private String errorMessage;
    private Integer retryCount;
    private LocalDateTime createdAt;
}
```

스케줄러로 주기적 재시도:
```java
@Scheduled(fixedDelay = 300000) // 5분마다
public void retryFailedOrders() {
    List<FailedOkposOrder> failedOrders = failedOrderRepository.findAll();
    for (FailedOkposOrder failed : failedOrders) {
        try {
            // 재시도 로직
        } catch (Exception e) {
            failed.setRetryCount(failed.getRetryCount() + 1);
        }
    }
}
```

---

## 7. 데이터베이스 스키마

### 7.1 기존 테이블 수정
```sql
-- orders 테이블에 OKPOS 주문 ID 컬럼 추가
ALTER TABLE orders 
ADD COLUMN okpos_order_id VARCHAR(100),
ADD COLUMN okpos_sync_status VARCHAR(20) DEFAULT 'PENDING'; -- PENDING, SUCCESS, FAILED

CREATE INDEX idx_orders_okpos_order_id ON orders(okpos_order_id);
```

### 7.2 OKPOS 연동 로그 테이블
```sql
CREATE TABLE okpos_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type VARCHAR(50) NOT NULL, -- MENU, ORDER, PAYMENT
    entity_id UUID, -- 연관된 주문 ID 등
    request_data JSONB,
    response_data JSONB,
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_okpos_sync_log_created_at ON okpos_sync_log(created_at);
CREATE INDEX idx_okpos_sync_log_status ON okpos_sync_log(status);
```

### 7.3 실패한 주문 큐 테이블
```sql
CREATE TABLE failed_okpos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    request_json TEXT NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_failed_okpos_orders_retry_count ON failed_okpos_orders(retry_count);
```

---

## 8. 환경 설정

### 8.1 application.yml
```yaml
okpos:
  api:
    base-url: https://dum.okpos.co.kr/api
    api-key: ${OKPOS_API_KEY:default-key-for-dev}
    timeout: 30000 # 30초
    retry:
      max-attempts: 3
      delay: 2000 # 2초

# 프로덕션 환경 (application-prod.yml)
spring:
  config:
    activate:
      on-profile: prod

okpos:
  api:
    api-key: ${OKPOS_API_KEY} # 환경변수에서 주입
```

### 8.2 환경변수 설정 (NCP Server)
```bash
# /etc/environment 또는 .bashrc
export OKPOS_API_KEY="your-production-api-key-here"

# 또는 systemd service 파일에서
Environment="OKPOS_API_KEY=your-production-api-key-here"
```

---

## 9. 테스트 방법

### 9.1 Swagger UI 테스트
1. `https://dum.okpos.co.kr/api/swagger-ui.html` 접속
2. **Authorize** 버튼 클릭 → API Key 입력
3. 각 엔드포인트 테스트

### 9.2 Postman Collection
```json
{
  "info": {
    "name": "OKPOS API Test"
  },
  "item": [
    {
      "name": "주문 생성",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-API-KEY",
            "value": "{{api_key}}"
          }
        ],
        "url": "{{base_url}}/api/order/create",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"storeId\": \"test-store\",\n  \"tableNumber\": \"1\"\n}"
        }
      }
    }
  ]
}
```

### 9.3 통합 테스트 코드
```java
@SpringBootTest
@ActiveProfiles("test")
class OkposOrderServiceTest {
    
    @Autowired
    private OkposOrderService okposOrderService;
    
    @MockBean
    private OkposApiClient okposApiClient;
    
    @Test
    void 주문_OKPOS_전송_성공() {
        // Given
        Order order = createTestOrder();
        OkposOrderResponse mockResponse = new OkposOrderResponse();
        mockResponse.setSuccess(true);
        mockResponse.setOkposOrderId("OKPOS-TEST-001");
        
        when(okposApiClient.createOrder(any())).thenReturn(mockResponse);
        
        // When
        okposOrderService.sendOrderToOkpos(order);
        
        // Then
        assertNotNull(order.getOkposOrderId());
        assertEquals("OKPOS-TEST-001", order.getOkposOrderId());
    }
}
```

---

## 10. 보안 고려사항

### 10.1 API Key 관리
✅ **권장 사항:**
- 환경변수로 관리 (`OKPOS_API_KEY`)
- Git에 절대 커밋하지 않기 (`.gitignore`에 추가)
- NCP Secrets Manager 사용 고려

❌ **절대 금지:**
```java
// 하드코딩 금지!
String apiKey = "sk-live-abc123...";
```

### 10.2 HTTPS 강제
```java
@Bean
public RestTemplate okposRestTemplate(RestTemplateBuilder builder) {
    if (!okposProperties.getBaseUrl().startsWith("https://")) {
        throw new IllegalStateException("OKPOS API는 HTTPS만 허용됩니다.");
    }
    // ...
}
```

### 10.3 요청 데이터 검증
```java
public void sendOrderToOkpos(Order order) {
    // 주문 금액 조작 방지
    Integer calculatedTotal = order.getOrderItems().stream()
        .mapToInt(item -> item.getMenuPrice() * item.getQuantity())
        .sum();
    
    if (!calculatedTotal.equals(order.getTotalPrice())) {
        throw new IllegalArgumentException("주문 금액 불일치");
    }
    
    // OKPOS 전송
    // ...
}
```

### 10.4 로그 마스킹
```java
log.info("OKPOS 주문 전송: orderId={}, tableNumber={}, totalPrice={}", 
    order.getId(), 
    order.getTable().getTableNumber(),
    order.getTotalPrice()
);
// API Key는 절대 로그에 남기지 않기!
```

---

## 11. 운영 시 체크리스트

### 11.1 배포 전
- [ ] API Key 환경변수 설정 확인
- [ ] OKPOS Swagger에서 API 테스트 완료
- [ ] 재시도 로직 테스트 완료
- [ ] 에러 알림 시스템 구축 (Slack, Email 등)

### 11.2 배포 후
- [ ] OKPOS 연동 성공률 모니터링 (CloudWatch, Grafana)
- [ ] 실패한 주문 큐 주기적 확인
- [ ] API 호출 성능 모니터링 (평균 응답 시간)

---

## 12. FAQ

**Q1. OKPOS API가 응답이 없을 때는?**
- Circuit Breaker가 작동하여 추가 호출을 차단합니다.
- 실패한 주문은 `failed_okpos_orders` 테이블에 저장됩니다.
- 스케줄러가 5분마다 재시도합니다.

**Q2. 메뉴 동기화 주기는?**
- 기본: 매일 새벽 3시 (Scheduler)
- 필요 시 관리자가 수동 동기화 가능

**Q3. OKPOS 주문 ID가 중복될 수 있나요?**
- OKPOS에서 UUID 또는 고유 ID를 반환하므로 중복 없음
- 만약을 대비해 DB에 UNIQUE 제약조건 추가 권장

**Q4. 결제 정보는 어떻게 동기화하나요?**
- 고객이 테이블에서 결제 완료 → OKPOS에 결제 완료 API 호출
- 또는 OKPOS에서 결제 완료 시 Webhook으로 알림 (지원 여부 확인 필요)

---

## 13. 참고 자료
- **OKPOS Swagger**: https://dum.okpos.co.kr/api/swagger-ui.html
- **Spring Retry 문서**: https://docs.spring.io/spring-retry/docs/current/reference/html/
- **Resilience4j 가이드**: https://resilience4j.readme.io/docs/circuitbreaker

---

> **작성일**: 2024-12-26  
> **작성자**: 테이블오더 개발팀  
> **버전**: 1.0
