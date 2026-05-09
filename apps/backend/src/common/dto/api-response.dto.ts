/**
 * Swagger 공통 응답 스키마 헬퍼
 * TransformInterceptor → { statusCode, data }
 * HttpExceptionFilter  → { statusCode, timestamp, path, message }
 */

/** 성공 응답 스키마 생성 헬퍼 */
export function successSchema(statusCode: number, dataExample: unknown) {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: statusCode },
      data: { example: dataExample },
    },
  };
}

/** 에러 응답 스키마 생성 헬퍼 */
export function errorSchema(statusCode: number, message: string, path = '/api/v1/...') {
  return {
    type: 'object',
    properties: {
      statusCode: { type: 'number', example: statusCode },
      timestamp: { type: 'string', example: '2024-01-01T12:00:00.000Z' },
      path: { type: 'string', example: path },
      message: { type: 'string', example: message },
    },
  };
}
