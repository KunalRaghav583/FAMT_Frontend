import axios, { AxiosError } from 'axios';
import type {
  User,
  Site,
  Asset,
  Ticket,
  Comment,
  DashboardSummary,
  PaginationMetadata,
  AuthResponse,
  RegisterResponse,
  AssetStatus,
  TicketPriority,
  TicketStatus,
  Role,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('famt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth failures and extract error messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('famt_token');
        localStorage.removeItem('famt_user');
        window.dispatchEvent(new Event('famt_auth_logout'));
      }
    }
    return Promise.reject(error);
  }
);

// Helper to format error message from backend
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (data?.error) return data.error;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

// 1. Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  register: async (name: string, email: string, password: string, role?: Role): Promise<RegisterResponse> => {
    const res = await apiClient.post<RegisterResponse>('/auth/register', { name, email, password, role });
    return res.data;
  },

  me: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/logout');
    return res.data;
  },
};

// 2. Sites API
export const sitesApi = {
  getAll: async (): Promise<{ sites: Site[] }> => {
    const res = await apiClient.get<{ sites: Site[] }>('/sites');
    return res.data;
  },

  getById: async (id: string): Promise<{ site: Site & { assets?: Asset[] } }> => {
    const res = await apiClient.get<{ site: Site & { assets?: Asset[] } }>(`/sites/${id}`);
    return res.data;
  },

  create: async (data: { name: string; location: string }): Promise<{ site: Site; message?: string }> => {
    const res = await apiClient.post<{ site: Site; message?: string }>('/sites', data);
    return res.data;
  },

  update: async (id: string, data: { name: string; location: string }): Promise<{ site: Site; message?: string }> => {
    const res = await apiClient.put<{ site: Site; message?: string }>(`/sites/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/sites/${id}`);
    return res.data;
  },
};

// 3. Assets API
export interface AssetListParams {
  search?: string;
  siteId?: string;
  status?: AssetStatus | '';
  page?: number;
  limit?: number;
}

export const assetsApi = {
  getAll: async (params?: AssetListParams): Promise<{ assets: Asset[]; pagination: PaginationMetadata }> => {
    const cleanParams: Record<string, string | number> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.siteId) cleanParams.siteId = params.siteId;
    if (params?.status) cleanParams.status = params.status;
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;

    const res = await apiClient.get<{ assets: Asset[]; pagination: PaginationMetadata }>('/assets', {
      params: cleanParams,
    });
    return res.data;
  },

  getById: async (id: string): Promise<{ asset: Asset }> => {
    const res = await apiClient.get<{ asset: Asset }>(`/assets/${id}`);
    return res.data;
  },

  create: async (data: {
    name: string;
    type: string;
    serialNo: string;
    status: AssetStatus;
    siteId: string;
  }): Promise<{ asset: Asset; message?: string }> => {
    const res = await apiClient.post<{ asset: Asset; message?: string }>('/assets', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<{
      name: string;
      type: string;
      serialNo: string;
      status: AssetStatus;
      siteId: string;
    }>
  ): Promise<{ asset: Asset; message?: string }> => {
    const res = await apiClient.put<{ asset: Asset; message?: string }>(`/assets/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<{ message: string }>(`/assets/${id}`);
    return res.data;
  },
};

// 4. Tickets API
export interface TicketListParams {
  status?: TicketStatus | '';
  priority?: TicketPriority | '';
  assigneeId?: string;
  assetId?: string;
  page?: number;
  limit?: number;
}

export const ticketsApi = {
  getAll: async (params?: TicketListParams): Promise<{ tickets: Ticket[]; pagination: PaginationMetadata }> => {
    const cleanParams: Record<string, string | number> = {};
    if (params?.status) cleanParams.status = params.status;
    if (params?.priority) cleanParams.priority = params.priority;
    if (params?.assigneeId) cleanParams.assigneeId = params.assigneeId;
    if (params?.assetId) cleanParams.assetId = params.assetId;
    if (params?.page) cleanParams.page = params.page;
    if (params?.limit) cleanParams.limit = params.limit;

    const res = await apiClient.get<{ tickets: Ticket[]; pagination: PaginationMetadata }>('/tickets', {
      params: cleanParams,
    });
    return res.data;
  },

  getById: async (id: string): Promise<{ ticket: Ticket }> => {
    const res = await apiClient.get<{ ticket: Ticket }>(`/tickets/${id}`);
    return res.data;
  },

  create: async (data: {
    title: string;
    description: string;
    priority: TicketPriority;
    dueDate: string;
    assetId: string;
    assigneeId?: string | null;
  }): Promise<{ ticket: Ticket; message?: string }> => {
    const res = await apiClient.post<{ ticket: Ticket; message?: string }>('/tickets', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: TicketPriority;
      dueDate: string;
      assetId: string;
      assigneeId: string | null;
    }>
  ): Promise<{ ticket: Ticket; message?: string }> => {
    const res = await apiClient.put<{ ticket: Ticket; message?: string }>(`/tickets/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: TicketStatus): Promise<{ ticket: Ticket; message?: string }> => {
    const res = await apiClient.patch<{ ticket: Ticket; message?: string }>(`/tickets/${id}/status`, { status });
    return res.data;
  },
};

// 5. Comments API
export const commentsApi = {
  getByTicketId: async (ticketId: string): Promise<{ comments: Comment[] }> => {
    const res = await apiClient.get<{ comments: Comment[] }>(`/tickets/${ticketId}/comments`);
    return res.data;
  },

  create: async (ticketId: string, body: string): Promise<{ comment: Comment; message?: string }> => {
    const res = await apiClient.post<{ comment: Comment; message?: string }>(`/tickets/${ticketId}/comments`, { body });
    return res.data;
  },
};

// 6. Dashboard API
export const dashboardApi = {
  getSummary: async (): Promise<{ summary: DashboardSummary }> => {
    const res = await apiClient.get<{ summary: DashboardSummary }>('/dashboard/summary');
    return res.data;
  },
};
