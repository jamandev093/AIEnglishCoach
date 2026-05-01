type Listener = () => void;

let listeners: Listener[] = [];

export const subscribeProfileUpdate = (fn: Listener) => {
  listeners.push(fn);
};

export const unsubscribeProfileUpdate = (fn: Listener) => {
  listeners = listeners.filter((l) => l !== fn);
};

export const emitProfileUpdate = () => {
  listeners.forEach((fn) => fn());
};