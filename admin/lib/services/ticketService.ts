import { ticketsService as ticketsApiService } from '../api/tickets';
import {
  CreateTicketRequest,
  UpdateTicketRequest,
  TicketStatus,
} from '../api/types';

/**
 * Unified ticket service that switches between mock and API
 */
export const ticketService = {
  getTickets: async (params?: { page?: number; limit?: number; status?: string; priority?: string; type?: string; assignedTo?: string }) => {
    return ticketsApiService.getTickets(params);
  },

  getTicket: async (id: string) => {
    return ticketsApiService.getTicket(id);
  },

  createTicket: async (data: CreateTicketRequest) => {
    return ticketsApiService.createTicket(data);
  },

  updateTicket: async (id: string, data: UpdateTicketRequest) => {
    return ticketsApiService.updateTicket(id, data);
  },

  updateTicketStatus: async (id: string, status: TicketStatus) => {
    return ticketsApiService.updateTicketStatus(id, status);
  },

  deleteTicket: async (id: string) => {
    return ticketsApiService.deleteTicket(id);
  },

  addComment: async (ticketId: string, content: string, _userId?: string) => {
    return ticketsApiService.addComment(ticketId, content);
  },

  isMockMode: () => false,
};
