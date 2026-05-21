import { EventEmitter } from "events";

// Global singleton so all API routes share the same emitter
declare global {
  // eslint-disable-next-line no-var
  var sseEmitter: EventEmitter | undefined;
}

export const sseEmitter: EventEmitter =
  global.sseEmitter ?? new EventEmitter();

global.sseEmitter = sseEmitter;
sseEmitter.setMaxListeners(100);

export function emitLeadUpdate(data: object) {
  sseEmitter.emit("lead-update", JSON.stringify(data));
}
