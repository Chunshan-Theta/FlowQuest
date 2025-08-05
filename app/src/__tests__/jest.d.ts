/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidObjectId(): R;
    }
  }
}

export {};
