// api-service.ts
// Service to handle all API communications with the HR Management System backend

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Get the base URL from environment variables or use default
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
    
    // Retrieve token from localStorage if it exists
    this.token = localStorage.getItem('token');
  }

  // Method to set the authentication token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Method to remove the authentication token
  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Private method to make HTTP requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Handle token expiration and refresh
      if (response.status === 401) {
        // Attempt to refresh token here if refresh logic is implemented
        // For now, we'll just remove the token and return an error
        this.removeToken();
        throw new Error('Unauthorized. Please log in again.');
      }

      const responseData: ApiResponse<T> = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'An error occurred');
      }

      return responseData;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw error;
    }
  }

  // AUTHENTICATION METHODS
  async login(email: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse> {
    const result = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    // Remove token regardless of API response
    this.removeToken();
    return result;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // LEAVE REQUEST METHODS
  async getLeaveRequests(params?: {
    userId?: number;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/leave?${queryString}` : '/leave';
    
    return this.request(endpoint);
  }

  async getLeaveRequestById(id: number): Promise<ApiResponse> {
    return this.request(`/leave/${id}`);
  }

  async createLeaveRequest(data: {
    leave_type_id: number;
    start_date: string;
    end_date: string;
    reason: string;
    attachments?: string[];
  }): Promise<ApiResponse> {
    return this.request('/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLeaveRequest(id: number, data: { status?: string; reason?: string }): Promise<ApiResponse> {
    return this.request(`/leave/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLeaveRequest(id: number): Promise<ApiResponse> {
    return this.request(`/leave/${id}`, {
      method: 'DELETE',
    });
  }

  // LEAVE TYPE METHODS
  async getLeaveTypes(): Promise<ApiResponse> {
    return this.request('/leave-types');
  }

  // STAFF METHODS
  async getStaff(params?: {
    department?: string;
    branch?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.department) queryParams.append('department', params.department);
    if (params?.branch) queryParams.append('branch', params.branch);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/staff?${queryString}` : '/staff';
    
    return this.request(endpoint);
  }

  async getStaffById(id: number): Promise<ApiResponse> {
    return this.request(`/staff/${id}`);
  }

  // ATTENDANCE METHODS
  async getAttendanceRecords(params?: {
    userId?: number;
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.date) queryParams.append('date', params.date);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/attendance?${queryString}` : '/attendance';

    return this.request(endpoint);
  }

  // MY ATTENDANCE METHODS (for self-access)
  async getMyAttendanceRecords(params?: {
    date?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params?.date) queryParams.append('date', params.date);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/attendance/my?${queryString}` : '/attendance/my';

    return this.request(endpoint);
  }

  async getMyAttendanceSummary(params: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);

    const queryString = queryParams.toString();
    const endpoint = `/attendance/my/summary?${queryString}`;

    return this.request(endpoint);
  }

  async getMyAttendanceRecordById(id: number): Promise<ApiResponse> {
    return this.request(`/attendance/my/${id}`);
  }

  // PAYROLL METHODS
  async getPayrollRecords(params?: {
    userId?: number;
    month?: string;
    year?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.userId) queryParams.append('userId', params.userId.toString());
    if (params?.month) queryParams.append('month', params.month);
    if (params?.year) queryParams.append('year', params.year);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/payroll?${queryString}` : '/payroll';
    
    return this.request(endpoint);
  }

  // FORM METHODS
  async getForms(): Promise<ApiResponse> {
    return this.request('/forms');
  }

  async getFormSubmissions(formId: number): Promise<ApiResponse> {
    return this.request(`/form-submissions?formId=${formId}`);
  }

  // PERMISSIONS
  async getUserPermissions(): Promise<ApiResponse> {
    return this.request('/auth/permissions');
  }
}

// Create a singleton instance of the API service
export const apiService = new ApiService();

export default ApiService;