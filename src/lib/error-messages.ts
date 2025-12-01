/**
 * User-friendly Error Messages
 * Centralized error message management with recovery guides
 */

export interface ErrorMessage {
  title: string
  message: string
  recoveryGuide?: string
  actionLabel?: string
  action?: () => void
}

// Error code to message mapping
export const ERROR_MESSAGES: Record<string, ErrorMessage> = {
  // Network errors
  NETWORK_ERROR: {
    title: '네트워크 오류',
    message: '인터넷 연결을 확인해주세요.',
    recoveryGuide: 'Wi-Fi 또는 모바일 데이터 연결을 확인한 후 다시 시도해주세요.',
    actionLabel: '다시 시도',
  },
  TIMEOUT_ERROR: {
    title: '요청 시간 초과',
    message: '서버 응답이 너무 오래 걸리고 있어요.',
    recoveryGuide: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.',
    actionLabel: '다시 시도',
  },

  // Authentication errors
  AUTHENTICATION_ERROR: {
    title: '인증 오류',
    message: '로그인이 필요합니다.',
    recoveryGuide: '로그인 후 다시 시도해주세요.',
    actionLabel: '로그인',
  },
  AUTHORIZATION_ERROR: {
    title: '접근 권한 없음',
    message: '이 기능에 접근할 권한이 없습니다.',
    recoveryGuide: '권한이 필요한 기능입니다. 관리자에게 문의해주세요.',
  },
  SESSION_EXPIRED: {
    title: '세션 만료',
    message: '로그인 세션이 만료되었습니다.',
    recoveryGuide: '다시 로그인해주세요.',
    actionLabel: '다시 로그인',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: '입력 오류',
    message: '입력하신 정보를 다시 확인해주세요.',
    recoveryGuide: '빨간색으로 표시된 필드를 확인하고 올바른 값을 입력해주세요.',
  },

  // Business logic errors
  SUBSCRIPTION_REQUIRED: {
    title: '구독 필요',
    message: '프리미엄 기능입니다.',
    recoveryGuide: '이 기능을 사용하려면 프리미엄 구독이 필요합니다.',
    actionLabel: '구독하기',
  },
  PET_LIMIT_EXCEEDED: {
    title: '반려동물 등록 한도 초과',
    message: '무료 플랜에서는 1마리만 등록할 수 있어요.',
    recoveryGuide: '프리미엄 구독 시 최대 5마리까지 등록할 수 있습니다.',
    actionLabel: '구독하기',
  },
  RATE_LIMIT_EXCEEDED: {
    title: '요청 한도 초과',
    message: '잠시 후 다시 시도해주세요.',
    recoveryGuide: '너무 많은 요청이 발생했습니다. 잠시 기다린 후 다시 시도해주세요.',
  },

  // Server errors
  DATABASE_ERROR: {
    title: '서버 오류',
    message: '데이터 처리 중 문제가 발생했어요.',
    recoveryGuide: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.',
    actionLabel: '다시 시도',
  },
  EXTERNAL_SERVICE_ERROR: {
    title: '외부 서비스 오류',
    message: '외부 서비스 연결에 실패했어요.',
    recoveryGuide: '잠시 후 다시 시도해주세요.',
    actionLabel: '다시 시도',
  },
  CIRCUIT_OPEN: {
    title: '서비스 일시 중단',
    message: '서비스가 일시적으로 불안정합니다.',
    recoveryGuide: '잠시 후 자동으로 복구됩니다. 잠시만 기다려주세요.',
  },

  // Resource errors
  NOT_FOUND: {
    title: '찾을 수 없음',
    message: '요청하신 정보를 찾을 수 없어요.',
    recoveryGuide: '주소를 확인하거나 다른 페이지를 이용해주세요.',
    actionLabel: '홈으로 이동',
  },

  // HTTP status code errors
  HTTP_400: {
    title: '잘못된 요청',
    message: '요청을 처리할 수 없어요.',
    recoveryGuide: '입력 정보를 확인한 후 다시 시도해주세요.',
  },
  HTTP_401: {
    title: '인증 필요',
    message: '로그인이 필요한 서비스입니다.',
    actionLabel: '로그인',
  },
  HTTP_403: {
    title: '접근 거부',
    message: '이 페이지에 접근할 권한이 없어요.',
  },
  HTTP_404: {
    title: '페이지를 찾을 수 없음',
    message: '요청하신 페이지가 존재하지 않아요.',
    actionLabel: '홈으로 이동',
  },
  HTTP_409: {
    title: '중복 데이터',
    message: '이미 존재하는 데이터입니다.',
  },
  HTTP_422: {
    title: '유효하지 않은 데이터',
    message: '입력하신 데이터가 올바르지 않아요.',
    recoveryGuide: '필수 항목을 확인하고 다시 시도해주세요.',
  },
  HTTP_429: {
    title: '요청 한도 초과',
    message: '너무 많은 요청을 보내셨어요.',
    recoveryGuide: '잠시 후 다시 시도해주세요.',
  },
  HTTP_500: {
    title: '서버 오류',
    message: '서버에 문제가 발생했어요.',
    recoveryGuide: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.',
    actionLabel: '다시 시도',
  },
  HTTP_502: {
    title: '서버 연결 오류',
    message: '서버에 연결할 수 없어요.',
    actionLabel: '다시 시도',
  },
  HTTP_503: {
    title: '서비스 점검 중',
    message: '서비스가 일시적으로 사용 불가합니다.',
    recoveryGuide: '서비스 점검 중이거나 과부하 상태입니다. 잠시 후 다시 시도해주세요.',
  },
  HTTP_504: {
    title: '서버 응답 없음',
    message: '서버가 응답하지 않아요.',
    actionLabel: '다시 시도',
  },

  // Default error
  UNKNOWN_ERROR: {
    title: '알 수 없는 오류',
    message: '예기치 못한 오류가 발생했어요.',
    recoveryGuide: '문제가 계속되면 고객센터로 문의해주세요.',
    actionLabel: '다시 시도',
  },
}

/**
 * Get error message by error code
 */
export function getErrorMessage(code: string): ErrorMessage {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Get error message from Error object
 */
export function getErrorMessageFromError(error: unknown): ErrorMessage {
  if (error instanceof Error && 'code' in error) {
    const code = (error as { code: string }).code
    return getErrorMessage(code)
  }

  if (error instanceof Error) {
    return {
      title: '오류 발생',
      message: error.message,
      actionLabel: '다시 시도',
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Format Zod validation errors to Korean
 */
export function formatZodErrors(errors: { path: (string | number)[]; message: string }[]): Record<string, string> {
  const formattedErrors: Record<string, string> = {}

  const fieldNames: Record<string, string> = {
    name: '이름',
    email: '이메일',
    password: '비밀번호',
    species: '종류',
    breed: '품종',
    birthDate: '생년월일',
    gender: '성별',
    weight: '체중',
    size: '크기',
    amount: '양',
    time: '시간',
    date: '날짜',
    duration: '시간',
    notes: '메모',
  }

  for (const error of errors) {
    const field = error.path.join('.')
    const fieldName = fieldNames[field] || field
    formattedErrors[field] = error.message.replace(field, fieldName)
  }

  return formattedErrors
}
