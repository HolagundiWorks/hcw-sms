// Type the values shared from the Vitest global setup via provide()/inject().
import 'vitest';

declare module 'vitest' {
  interface ProvidedContext {
    baseUrl: string;
    dbPath: string;
  }
}
