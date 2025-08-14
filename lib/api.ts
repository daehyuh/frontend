// 외부 API 서버 연결
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

console.log('API_BASE_URL:', API_BASE_URL);

interface ApiResponse<T> {
  success?: boolean;
  description?: string;
  data?: T;
  detail?: string;
  message?: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
  time_created: string;
}

interface ImageUploadResponse {
  id: number;
  user_id: number;
  time_created: string;
}

interface ValidateResponse {
  validation_id: string;
  original_image_id: string;
  tampering_rate: number;
  tampered_regions_mask: string;
}

interface ValidationRecordDetail {
  validation_id: string;
  record_id: number;
  user_id: number;
  input_filename: string;
  has_watermark: boolean;
  detected_watermark_image_id: number | null;
  modification_rate: number | null;
  validation_algorithm: string;
  validation_time: string;
  s3_path: string;
  s3_mask_url?: string;
  detected_watermark_info?: {
    image_id: number;
    filename: string;
    copyright: string;
    upload_time: string;
  };
}

interface AlgorithmInfo {
  name: string;
  title: string;
  description: string;
}

interface AlgorithmsResponse {
  [key: string]: AlgorithmInfo;
}

interface ImageDetailResponse {
  id: number;
  user_id: number;
  copyright: string;
  time_created: string;
  original_url?: string;
  watermarked_url?: string;
  filename?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  description: string;
  data: T[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

class ApiClient {
  private static instance: ApiClient;
  private accessToken: string | null = null;

  private constructor() {
    // 브라우저 환경에서만 쿠키에서 토큰 읽기
    if (typeof window !== 'undefined') {
      this.accessToken = this.getCookie('access_token');
    }
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // 쿠키 설정
  private setCookie(name: string, value: string, days: number = 7) {
    if (typeof window !== 'undefined') {
      const expires = new Date();
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
    }
  }

  // 쿠키 읽기
  private getCookie(name: string): string | null {
    if (typeof window !== 'undefined') {
      const nameEQ = name + "=";
      const ca = document.cookie.split(';');
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  }

  // 쿠키 삭제
  private deleteCookie(name: string) {
    if (typeof window !== 'undefined') {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
    console.log('Setting access token:', token);
    
    // 로그인 유지 설정에 따라 토큰 저장 기간 조정
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const expiryDays = rememberMe ? 30 : 7; // 로그인 유지: 30일, 일반: 7일
    
    // 쿠키에 토큰 저장
    this.setCookie('access_token', token, expiryDays);
  }

  setRefreshToken(token: string) {
    console.log('Setting refresh token:', token);
    
    // 로그인 유지 설정에 따라 토큰 저장 기간 조정
    const rememberMe = localStorage.getItem('remember_me') === 'true';
    const expiryDays = rememberMe ? 60 : 30; // 로그인 유지: 60일, 일반: 30일
    
    // 쿠키에 리프레시 토큰 저장
    this.setCookie('refresh_token', token, expiryDays);
  }

  clearTokens() {
    this.accessToken = null;
    // 쿠키에서 토큰 삭제
    this.deleteCookie('access_token');
    this.deleteCookie('refresh_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['access-token'] = this.accessToken;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      headers,
      body: options.body
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      
      // 백엔드 응답에서 구체적인 에러 메시지 추출
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      } else {
        // HTTP 상태 코드별 기본 메시지
        switch (response.status) {
          case 400:
            errorMessage = '잘못된 요청입니다. 입력 정보를 확인해주세요.';
            break;
          case 401:
            errorMessage = '인증에 실패했습니다. 다시 로그인해주세요.';
            break;
          case 403:
            errorMessage = '접근 권한이 없습니다.';
            break;
          case 404:
            errorMessage = '요청한 리소스를 찾을 수 없습니다.';
            break;
          case 409:
            errorMessage = '이미 존재하는 데이터입니다.';
            break;
          case 422:
            errorMessage = '입력 데이터가 올바르지 않습니다.';
            break;
          case 500:
            errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
            break;
          default:
            errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('API Response Data:', data);
    return data;
  }


  // 회원가입
  async signup(name: string, email: string, password: string): Promise<ApiResponse<string>> {
    return this.request<ApiResponse<string>>('/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
  }

  // 로그인
  async login(email: string, password: string, rememberMe = false): Promise<LoginResponse> {
    const response = await this.request<ApiResponse<LoginResponse[]>>('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // 응답 형식에 따라 토큰 설정
    if (response.data && response.data[0]) {
      const { access_token, refresh_token } = response.data[0];
      this.setAccessToken(access_token);
      this.setRefreshToken(refresh_token);
      
      // 로그인 유지 옵션 저장
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remember_me');
      }
      
      // 인증 상태 변경 이벤트 발생
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authStateChanged'));
      }
      
      return response.data[0];
    }

    throw new Error('로그인 응답 형식 오류');
  }

  // 내 정보 조회
  async getMe(): Promise<UserResponse> {
    const response = await this.request<ApiResponse<UserResponse[]>>('/users/me', {
      method: 'GET',
    });

    // 배열 형태로 응답이 오는 경우 첫 번째 요소 반환
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error('사용자 정보를 찾을 수 없습니다.');
  }

  // 알고리즘 목록 조회
  async getAlgorithms(): Promise<AlgorithmsResponse> {
    const response = await this.request<ApiResponse<AlgorithmsResponse[]>>('/algorithms', {
      method: 'GET',
    });

    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error('알고리즘 목록을 가져올 수 없습니다.');
  }

  // 보호 알고리즘 목록 조회 (기존 호환성)
  async getProtectionAlgorithms(): Promise<string[]> {
    try {
      const algorithms = await this.getAlgorithms();
      return Object.keys(algorithms);
    } catch (error) {
      console.error('Failed to fetch protection algorithms:', error);
      return ['EditGuard', 'RobustWide'];
    }
  }

  // 이미지 업로드 (보호 알고리즘 선택 추가)
  async uploadImage(copyright: string, file: File, protectionAlgorithm: string = 'EditGuard'): Promise<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('copyright', copyright);
    formData.append('protection_algorithm', protectionAlgorithm);
    
    return this.request<ImageUploadResponse>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // 이미지 검증 (검증 모델 선택 추가)
  async validateImage(file: File, model: string = 'EditGuard'): Promise<ValidateResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', model);

    const response = await this.request<ApiResponse<ValidateResponse[]>>('/validate', {
      method: 'POST',
      body: formData,
    });

    // 배열 형태로 응답이 오는 경우 첫 번째 요소 반환
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }

    throw new Error('검증 응답을 받지 못했습니다.');
  }

  // 사용자 이미지 목록 조회 (API 명세서의 /images 엔드포인트 사용)
  async getUserImages(limit: number = 20, offset: number = 0): Promise<PaginatedResponse<any>> {
    const response = await this.request<PaginatedResponse<any>>(`/images?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    
    console.log('getUserImages response:', JSON.stringify(response, null, 2));
    return response;
  }

  // 이미지 상세 정보 조회
  async getImageDetail(imageId: number): Promise<ImageDetailResponse> {
    return this.request<ImageDetailResponse>(`/images/${imageId}`, {
      method: 'GET',
    });
  }

  // 로그아웃
  logout() {
    this.clearTokens();
    // 로그인 유지 설정도 제거
    localStorage.removeItem('remember_me');
    
    // 인증 상태 변경 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('authStateChanged'));
    }
  }

  // 토큰 확인 (로컬 체크)
  isAuthenticated(): boolean {
    // 쿠키에서 토큰을 다시 읽어와서 확인
    const cookieToken = this.getCookie('access_token');
    const hasToken = !!(this.accessToken || cookieToken);
    
    // 토큰이 쿠키에 있지만 메모리에 없으면 메모리에 저장
    if (cookieToken && !this.accessToken) {
      this.accessToken = cookieToken;
    }
    
    console.log('isAuthenticated check:', { 
      accessToken: this.accessToken ? 'exists' : 'null',
      cookieToken: cookieToken ? 'exists' : 'null',
      hasToken 
    });
    return hasToken;
  }

  // 서버에서 토큰 검증 (보안 강화)
  async verifyToken(): Promise<boolean> {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/verify-token`, {
        method: 'GET',
        headers: {
          'access-token': this.accessToken || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.success && data.data?.[0]?.valid === true;
      } else if (response.status === 401) {
        // 토큰이 만료되었거나 유효하지 않음
        this.logout();
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('토큰 검증 실패:', error);
      return false;
    }
  }

  // 검증 기록 조회
  async getValidationHistory(limit: number = 10, offset: number = 0): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/validation-history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  }

  // 내 검증 요약 정보 조회
  async getMyValidationSummary(limit: number = 10, offset: number = 0): Promise<ApiResponse<any[]>> {
    const response = await this.request<ApiResponse<any[]>>(`/my-validation-summary?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
    
    console.log('getMyValidationSummary response:', JSON.stringify(response, null, 2));
    return response;
  }
  
  // UUID로 검증 레코드 상세 조회
  async getValidationRecordByUuid(validationUuid: string): Promise<ValidationRecordDetail> {
    const response = await this.request<ApiResponse<ValidationRecordDetail[]>>(`/validation-record/uuid/${validationUuid}`, {
      method: 'GET',
    });
    
    // 배열 형태로 응답이 오는 경우 첫 번째 요소 반환
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    throw new Error('검증 레코드를 찾을 수 없습니다.');
  }

  // 토큰 갱신
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getCookie('refresh_token');
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.access_token) {
          this.setAccessToken(data.access_token);
          return true;
        }
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
    }

    return false;
  }
}

export const apiClient = ApiClient.getInstance();
export type { LoginResponse, UserResponse, ImageUploadResponse, ValidateResponse, ImageDetailResponse, ValidationRecordDetail, AlgorithmInfo, AlgorithmsResponse };