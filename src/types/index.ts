// Enums & Literal Types
export type Role = "Admin" | "Technician" | "Viewer";
export type AssetStatus = "Active" | "Under_maintenance" | "Retired";
export type TicketPriority = "Low" | "Medium" | "High" | "Critical";
export type TicketStatus = "Open" | "In_progress" | "Resolved" | "Closed";

// User
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

// Site
export interface Site {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  _count?: {
    assets: number;
  };
}

// Asset
export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNo: string;
  status: AssetStatus;
  siteId: string;
  createdAt: string;
  site?: {
    id: string;
    name: string;
    location: string;
  };
  _count?: {
    tickets: number;
  };
}

// Comment
export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  message?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

// Ticket
export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assetId: string;
  assigneeId: string | null;
  createdBy: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    name: string;
    serialNo: string;
    status: AssetStatus;
    type?: string;
    site?: {
      id: string;
      name: string;
      location: string;
    };
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  creator?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

// Pagination
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Dashboard Summary
export interface DashboardSummary {
  totalAssets: number;
  totalTickets: number;
  openTickets: number;
  overdueTickets: number;
  assetsUnderMaintenance: number;
  ticketsByStatus: {
    Open: number;
    "In progress": number;
    Resolved: number;
    Closed: number;
  };
  ticketsByPriority: {
    Low: number;
    Medium: number;
    High: number;
    Critical: number;
  };
  assetsByStatus: {
    Active: number;
    "Under maintenance": number;
    Retired: number;
  };
}

// Auth API types
export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface ApiErrorResponse {
  error: string;
}
