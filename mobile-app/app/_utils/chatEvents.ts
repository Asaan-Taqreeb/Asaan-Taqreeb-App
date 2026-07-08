type Listener = () => void;
const listeners = new Set<Listener>();

export const registerChatListener = (l: Listener) => {
  listeners.add(l);
};

export const unregisterChatListener = (l: Listener) => {
  listeners.delete(l);
};

export const triggerChatRefresh = () => {
  listeners.forEach(l => {
    try { l(); } catch (_) {}
  });
};

// Registry for optimistic per-chatId unread count reset
type ResetCallback = (chatId?: string) => void;
const resetCallbacks = new Set<ResetCallback>();

export const registerChatResetListener = (cb: ResetCallback) => {
  resetCallbacks.add(cb);
};

export const unregisterChatResetListener = (cb: ResetCallback) => {
  resetCallbacks.delete(cb);
};

export const triggerChatReset = (chatId?: string) => {
  resetCallbacks.forEach(cb => {
    try { cb(chatId); } catch (_) {}
  });
};
