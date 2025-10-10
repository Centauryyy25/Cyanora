import 'next/server';
import type { Session } from 'next-auth';

declare module 'next/server' {
  interface NextRequest {
    auth?:
      | Session
      | null
      | {
          user?: {
            id: string;
            email?: string;
            role?: string;
          };
          session?: Record<string, any>;
          [key: string]: any;
        };
  }
}
