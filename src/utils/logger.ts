/**
 * @fileoverview 환경별 로깅 유틸리티
 *
 * 개발 환경에서는 상세한 로그를 출력하고,
 * 프로덕션 환경에서는 민감한 정보를 제거하거나 마스킹합니다.
 *
 * 보안 고려사항:
 * - 사용자 ID, 이메일 등 민감한 정보는 프로덕션에서 마스킹
 * - 에러 스택 트레이스는 개발 환경에서만 표시
 * - 에러 ID를 생성하여 사용자 버그 신고 시 사용
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * 민감한 정보를 마스킹합니다
 */
function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };
  const sensitiveFields = ['email', 'clerkId', '_id', 'userId', 'token', 'password', 'apiKey'];

  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      if (typeof masked[key] === 'string' && masked[key].length > 0) {
        // 이메일의 경우 @ 앞부분만 일부 표시
        if (key.toLowerCase().includes('email')) {
          const email = masked[key] as string;
          const [local, domain] = email.split('@');
          if (local && domain) {
            masked[key] = `${local.substring(0, 2)}***@${domain}`;
          } else {
            masked[key] = '***';
          }
        } else {
          // ID나 토큰의 경우 앞 4자리만 표시
          const str = masked[key] as string;
          masked[key] = str.length > 4 ? `${str.substring(0, 4)}***` : '***';
        }
      } else {
        masked[key] = '***';
      }
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }

  return masked;
}

/**
 * 에러 ID를 생성합니다 (버그 신고용)
 */
function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * 안전한 로깅 함수
 */
export const logger = {
  /**
   * 개발 환경에서만 상세 로그 출력
   */
  debug: (component: string, message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[${component}] ${message}`, data);
    }
  },

  /**
   * 프로덕션에서도 출력하되 민감한 정보는 마스킹
   */
  info: (component: string, message: string, data?: any) => {
    const safeData = isDevelopment ? data : maskSensitiveData(data);
    console.log(`[${component}] ${message}`, safeData);
  },

  /**
   * 에러 로깅 (프로덕션에서도 출력, 민감한 정보 마스킹)
   * 에러 ID를 반환하여 사용자에게 표시 가능
   */
  error: (component: string, message: string, error?: any): string => {
    const errorId = generateErrorId();
    const safeError = isDevelopment 
      ? error 
      : {
          message: error instanceof Error ? error.message : String(error),
          // 스택 트레이스는 개발 환경에서만
          stack: undefined,
        };

    console.error(`[${component}] ${message}`, {
      errorId,
      error: safeError,
      timestamp: new Date().toISOString(),
    });

    return errorId;
  },

  /**
   * 경고 로깅
   */
  warn: (component: string, message: string, data?: any) => {
    const safeData = isDevelopment ? data : maskSensitiveData(data);
    console.warn(`[${component}] ${message}`, safeData);
  },
};

/**
 * 환경 정보 확인
 */
export const isDev = isDevelopment;

