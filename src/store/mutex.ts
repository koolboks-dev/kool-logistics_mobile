/**
 * A tiny async mutex (no dependency) so only one token refresh runs at a time.
 */
export class Mutex {
  private locked = false;
  private waiters: (() => void)[] = [];

  isLocked(): boolean {
    return this.locked;
  }

  async acquire(): Promise<() => void> {
    while (this.locked) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.locked = true;
    return () => {
      this.locked = false;
      const waiters = this.waiters;
      this.waiters = [];
      waiters.forEach((resolve) => resolve());
    };
  }

  async waitForUnlock(): Promise<void> {
    while (this.locked) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
  }
}
