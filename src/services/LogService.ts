import { DecisionLog } from '../types';

// In-memory store for demo
const LOGS_STORE: DecisionLog[] = [];

export const LogService = {
  addLog: (_cardId: string, action: string, message: string, actorId: string) => {
    const log: DecisionLog = {
      id: crypto.randomUUID(),
      action,
      comment: message,
      actor_id: actorId,
      timestamp: new Date().toISOString()
    };
    LOGS_STORE.push(log);
    return log;
  },

  getLogs: (_cardId: string) => {
    return LOGS_STORE; // Filter if we had cardId inside log
  }
};
