import { apiClient } from './client';
import type { Ticket, CreateTicketRequest, UpdateTicketRequest, ApiResponse, ApiListResponse, TicketStatus } from './types';

// Use the singleton apiClient to ensure tenant context is shared

export class TicketsService {
  async getTickets(params?: { page?: number; limit?: number; status?: string; priority?: string; type?: string; assignedTo?: string }): Promise<ApiListResponse<Ticket>> {
    return apiClient.get<ApiListResponse<Ticket>>('/tickets', params);
  }

  async getTicket(id: string): Promise<ApiResponse<Ticket>> {
    return apiClient.get<ApiResponse<Ticket>>(`/tickets/${id}`);
  }

  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<Ticket>> {
    return apiClient.post<ApiResponse<Ticket>>('/tickets', data);
  }

  async updateTicket(id: string, data: UpdateTicketRequest): Promise<ApiResponse<Ticket>> {
    return apiClient.put<ApiResponse<Ticket>>(`/tickets/${id}`, data);
  }

  async updateTicketStatus(id: string, status: TicketStatus): Promise<ApiResponse<Ticket>> {
    return apiClient.put<ApiResponse<Ticket>>(`/tickets/${id}/status`, { status });
  }

  async addComment(id: string, content: string): Promise<ApiResponse<Ticket>> {
    return apiClient.post<ApiResponse<Ticket>>(`/tickets/${id}/comments`, { content });
  }

  async deleteTicket(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/tickets/${id}`);
  }
}

export const ticketsService = new TicketsService();
