import axios from 'axios';
import {
  ChatRequest,
  ChatResponse,
  ConversationDetail,
  ConversationsListResponse,
  HealthResponse,
  StatsResponse,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await apiClient.get<StatsResponse>('/stats');
    return response.data;
  },

  getConversations: async (): Promise<ConversationsListResponse> => {
    const response = await apiClient.get<ConversationsListResponse>('/conversations');
    return response.data;
  },

  getConversation: async (threadId: string): Promise<ConversationDetail> => {
    const response = await apiClient.get<ConversationDetail>(`/conversations/${threadId}`);
    return response.data;
  },

  createOrContinueChat: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post<ChatResponse>('/chat', data);
    return response.data;
  },

  renameConversation: async (threadId: string, newTitle: string): Promise<void> => {
    // Note: API requires title as query param
    await apiClient.put(`/conversations/${threadId}/title`, null, {
      params: { title: newTitle },
    });
  },

  deleteConversation: async (threadId: string): Promise<void> => {
    await apiClient.delete(`/conversations/${threadId}`);
  },
};
