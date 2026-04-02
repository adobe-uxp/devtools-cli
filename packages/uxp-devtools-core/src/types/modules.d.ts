/*
 * External module type declarations
 */

// Module declaration for ignore-walk (no @types available)
declare module 'ignore-walk' {
  interface WalkOptions {
    path?: string;
    ignoreFiles?: string[];
    includeEmpty?: boolean;
    follow?: boolean;
  }

  export function sync(options?: WalkOptions): string[];
  export function walk(options?: WalkOptions, callback?: (err: Error | null, files: string[]) => void): Promise<string[]>;
  const ignoreWalk: { sync: typeof sync; walk: typeof walk };
  export default ignoreWalk;
}

// Module declaration for @adobe/uxp-inspect-app (internal Adobe package)
declare module '@adobe/uxp-inspect-app' {
  function uxpInspectApp(
    unknown: string,
    appId: string,
    appVersion: string,
    wsDebugUrl: string,
  ): void;
  export default uxpInspectApp;
}
