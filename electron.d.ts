export {};

declare global {
  interface Window {
    electronAPI?: {
      getEnv?: (key: string) => Promise<string | null>;
      gemini?: {
        fetchSpectralData: (query: string) => Promise<any>;
        analyzeSpectra: (datasets: any) => Promise<any>;
      };
      store?: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
      };
    };
  }
}
