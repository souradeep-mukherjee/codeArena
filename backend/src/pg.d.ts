declare module 'pg' {
  export class Pool {
    constructor(config?: { connectionString?: string });
    query(text: string, params?: unknown[]): Promise<unknown>;
  }
}
