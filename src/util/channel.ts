interface Receiver<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export default class Channel<T> implements AsyncIterable<T> {
  private receivers: Receiver<T>[] = [];
  private queue: [T, () => void][] = [];
  private closed: boolean = false;

  public receive(): Promise<T> {
    if (this.closed) {
      throw new Error("Cannot receive from closed channel");
    }

    if (this.queue.length > 0) {
      const [value, resolve] = this.queue.shift()!;
      resolve();
      return Promise.resolve(value);
    }

    return new Promise((resolve, reject) => {
      this.receivers.push({ resolve, reject });
    });
  }

  public async send(...values: T[]): Promise<void> {
    if (this.closed) {
      throw new Error("Cannot send to closed channel");
    }

    let next = Promise.resolve();
    for (const value of values) {
      const receiver = this.receivers.shift();
      if (receiver) {
        receiver.resolve(value);
      } else {
        next = next.then(
          () =>
            new Promise((resolve) => {
              this.queue.push([value, resolve]);
            })
        );
      }
    }

    return next;
  }

  public [Symbol.asyncIterator](): AsyncIterator<T> {
    const self = this;
    return {
      async next(): Promise<IteratorResult<T>> {
        try {
          const value = await self.receive();
          return { done: false, value };
        } catch {
          return { done: true, value: undefined };
        }
      },
    };
  }

  public close() {
    for (const receiver of this.receivers) {
      receiver.reject(new Error("Channel closed"));
    }
    this.receivers = [];
    this.closed = true;
  }
}
