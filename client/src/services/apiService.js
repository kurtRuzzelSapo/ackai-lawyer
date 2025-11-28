const API_BASE = '/api';

export const apiService = {
  async getConfig() {
    const response = await fetch(`${API_BASE}/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }
    return response.json();
  },

  async startConvoAI(config) {
    const response = await fetch(`${API_BASE}/convo-ai/start`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to start conversation AI');
    }
    
    return response.json();
  },

  async stopConvoAI(agentId) {
    const response = await fetch(`${API_BASE}/convo-ai/agents/${agentId}/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to stop conversation AI');
    }
    
    return response.json();
  },

  async cleanupConvoAI(channel) {
    const response = await fetch(`${API_BASE}/convo-ai/cleanup`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ channel })
    });
    
    if (!response.ok) {
      throw new Error('Failed to cleanup conversation');
    }
    
    return response.json();
  }
};
