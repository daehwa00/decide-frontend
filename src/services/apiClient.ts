import type {
  ApiIssueCreateRequest,
  ApiIssueCreateResponse,
  ApiIssueResponse,
  ApiGraphNode,
  ApiGraphEdge,
  ApiPersonResponse,
  AuditLogResponse,
  MeetingInput,
  VirtualMeetingRequest
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://decide-api.glowme.kr';
const DEFAULT_USER_ID = import.meta.env.VITE_USER_ID ?? 'person-staff-720';

const getUserId = () => {
  return localStorage.getItem('decide_user_id') ?? DEFAULT_USER_ID;
};

const buildUrl = (path: string) => {
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('X-User-ID', getUserId());

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Network error for ${buildUrl(path)}: ${message}`);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status} ${response.statusText} for ${buildUrl(path)}: ${text || 'No response body'}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const ApiClient = {
  getCurrentUserId: () => getUserId(),
  createIssue: (payload: ApiIssueCreateRequest) =>
    apiFetch<ApiIssueCreateResponse>('/api/issues/', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  listIssues: (params?: { skip?: number; limit?: number; status?: string; myIssues?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.skip !== undefined) search.set('skip', String(params.skip));
    if (params?.limit !== undefined) search.set('limit', String(params.limit));
    if (params?.status) search.set('status', params.status);
    if (params?.myIssues !== undefined) search.set('my_issues', String(params.myIssues));
    const query = search.toString();
    return apiFetch<ApiIssueResponse[]>(`/api/issues/${query ? `?${query}` : ''}`);
  },
  getIssue: (issueId: string) => apiFetch<ApiIssueResponse>(`/api/issues/${issueId}`),
  getCurrentUser: () => apiFetch<ApiPersonResponse>('/api/persons/me'),
  getDecisionCard: (cardId: string) => apiFetch(`/api/decisions/${cardId}`),
  getRunTimeline: (runId: string) => apiFetch<AuditLogResponse[]>(`/api/audit/runs/${runId}/timeline`),
  submitMeeting: (runId: string, payload: MeetingInput) =>
    apiFetch(`/api/meetings/${runId}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  approveDecision: (cardId: string, payload: { approver_id: string; comment?: string | null }) =>
    apiFetch(`/api/decisions/${cardId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  conditionalApproveDecision: (cardId: string, payload: { approver_id: string; conditions: string[]; comment?: string | null }) =>
    apiFetch(`/api/decisions/${cardId}/conditional-approve`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  rejectDecision: (cardId: string, payload: { approver_id: string; reason: string; comment?: string | null }) =>
    apiFetch(`/api/decisions/${cardId}/reject`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  withdrawDecision: (cardId: string, payload: { requester_id: string; reason: string }) =>
    apiFetch(`/api/decisions/${cardId}/withdraw`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getFullGraph: async (options?: { maxNodes?: number; maxEdges?: number }) => {
    const search = new URLSearchParams();
    if (options?.maxNodes) search.set('max_nodes', String(options.maxNodes));
    if (options?.maxEdges) search.set('max_edges', String(options.maxEdges));
    const query = search.toString();
    const data = await apiFetch<{ nodes?: ApiGraphNode[]; edges?: ApiGraphEdge[] }>(
      `/api/graphs/full${query ? `?${query}` : ''}`
    );
    return {
      nodes: data?.nodes ?? [],
      edges: data?.edges ?? []
    };
  },
  getSubgraph: async (runId: string, maxNodes = 120) => {
    const data = await apiFetch<{ nodes?: ApiGraphNode[]; edges?: ApiGraphEdge[] }>(
      `/api/graphs/${runId}/subgraph?max_nodes=${maxNodes}`
    );
    return {
      nodes: data?.nodes ?? [],
      edges: data?.edges ?? []
    };
  }
};

type SseHandlers = {
  onEvent: (event: string, data: any) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
};

const parseSseStream = async (
  response: Response,
  handlers: SseHandlers,
  signal?: AbortSignal
) => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('SSE stream is not readable.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let eventType = 'message';
  let dataLines: string[] = [];

  handlers.onOpen?.();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    let lineEndIndex = buffer.indexOf('\n');

    while (lineEndIndex !== -1) {
      let line = buffer.slice(0, lineEndIndex);
      buffer = buffer.slice(lineEndIndex + 1);
      line = line.replace(/\r$/, '');

      if (line === '') {
        if (dataLines.length > 0) {
          const dataString = dataLines.join('\n');
          handlers.onEvent(eventType, safeJsonParse(dataString));
        }
        eventType = 'message';
        dataLines = [];
      } else if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }

      lineEndIndex = buffer.indexOf('\n');
    }

    if (signal?.aborted) break;
  }
};

const safeJsonParse = (payload: string) => {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const startSse = async (
  path: string,
  options: RequestInit,
  handlers: SseHandlers,
  signal: AbortSignal
) => {
  const headers = new Headers(options.headers);
  headers.set('X-User-ID', getUserId());
  headers.set('Accept', 'text/event-stream');

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    signal
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SSE ${response.status}: ${text || response.statusText}`);
  }

  await parseSseStream(response, handlers, signal);
};

export const SseClient = {
  streamDecision: (runId: string, handlers: SseHandlers) => {
    const controller = new AbortController();
    startSse(
      `/api/decisions/stream/${runId}`,
      { method: 'GET' },
      handlers,
      controller.signal
    ).catch(error => {
      if (!controller.signal.aborted) {
        handlers.onError?.(error as Error);
      }
    });
    return () => controller.abort();
  },
  generateVirtualMeeting: (runId: string, payload: VirtualMeetingRequest, handlers: SseHandlers) => {
    const controller = new AbortController();
    startSse(
      `/api/virtual-meetings/generate/${runId}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      },
      handlers,
      controller.signal
    ).catch(error => {
      if (!controller.signal.aborted) {
        handlers.onError?.(error as Error);
      }
    });
    return () => controller.abort();
  }
};
