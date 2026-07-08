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
