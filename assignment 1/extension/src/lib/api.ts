export interface StorageConfig {
  apiUrl: string;
  apiToken: string;
  currentUser?: {
    id: string;
    email: string;
    displayName: string;
    memberId?: string;
  };
}

export const DEFAULT_API_URL = 'http://localhost:3000';
export const DEMO_API_TOKEN = 'ecell_ext_token_demo_987654321';

export async function getConfig(): Promise<StorageConfig> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['apiUrl', 'apiToken', 'currentUser'], (result) => {
        resolve({
          apiUrl: result.apiUrl || DEFAULT_API_URL,
          apiToken: result.apiToken || '',
          currentUser: result.currentUser,
        });
      });
    } else {
      const apiUrl = localStorage.getItem('ecell_apiUrl') || DEFAULT_API_URL;
      const apiToken = localStorage.getItem('ecell_apiToken') || '';
      const userStr = localStorage.getItem('ecell_currentUser');
      resolve({
        apiUrl,
        apiToken,
        currentUser: userStr ? JSON.parse(userStr) : undefined,
      });
    }
  });
}

export async function setConfig(config: Partial<StorageConfig>): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(config, () => resolve());
    } else {
      if (config.apiUrl !== undefined) localStorage.setItem('ecell_apiUrl', config.apiUrl);
      if (config.apiToken !== undefined) localStorage.setItem('ecell_apiToken', config.apiToken);
      if (config.currentUser !== undefined) localStorage.setItem('ecell_currentUser', JSON.stringify(config.currentUser));
      resolve();
    }
  });
}

export async function clearConfig(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['apiToken', 'currentUser'], () => resolve());
    } else {
      localStorage.removeItem('ecell_apiToken');
      localStorage.removeItem('ecell_currentUser');
      resolve();
    }
  });
}

export async function fetchApi<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = await getConfig();
  const url = `${config.apiUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (config.apiToken) {
    headers.set('Authorization', `Bearer ${config.apiToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data && data.error) || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export async function verifyToken(token: string, apiUrl: string = DEFAULT_API_URL): Promise<any> {
  const url = `${apiUrl.replace(/\/$/, '')}/api/auth/me`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || !data.user) {
    throw new Error((data && data.error) || 'Invalid or expired API token');
  }

  return data.user;
}

export async function getReminders() {
  return fetchApi('/api/actions/reminders');
}

export async function getMeetings(limit: number = 10) {
  return fetchApi(`/api/meetings?limit=${limit}`);
}

export async function getMembers() {
  return fetchApi('/api/members');
}

export async function createMeeting(data: {
  title: string;
  startsAt?: string;
  notes?: string;
  rawText?: string;
  source?: string;
  attendeeIds?: string[];
  decisions?: { text: string }[];
  actionItems?: {
    title: string;
    assigneeId?: string | null;
    dueDate?: string | null;
    origin?: string;
  }[];
}) {
  return fetchApi('/api/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function extractAiItems(text: string, meetingDate?: string) {
  return fetchApi('/api/extract', {
    method: 'POST',
    body: JSON.stringify({
      text,
      meetingDate: meetingDate || new Date().toISOString(),
    }),
  });
}

export async function updateActionStatus(actionId: string, status: 'open' | 'in_progress' | 'done') {
  return fetchApi(`/api/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
