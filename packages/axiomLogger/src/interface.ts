
export interface NetlifyInfo extends PlatformInfo {
    buildId?: string;
    context?: string;
    deploymentUrl?: string;
    deploymentId?: string;
    siteId?: string;
  }
  
  export interface LogEvent {
    level: string;
    message: string;
    fields: any;
    _time: string;
    request?: RequestReport;
    platform?: PlatformInfo;
    vercel?: PlatformInfo;
    netlify?: NetlifyInfo;
  }
  
  export enum LogLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3,
    off = 100,
  }
  
  export interface RequestReport {
    startTime: number;
    statusCode?: number;
    ip?: string | null;
    region?: string | null;
    path: string;
    host?: string | null;
    method: string;
    scheme: string;
    userAgent?: string | null;
  }
  
  export interface PlatformInfo {
    environment?: string;
    region?: string;
    route?: string;
    source?: string;
  }
  
  export type LoggerConfig = {
    args?: { [key: string]: any };
    logLevel?: LogLevel;
    autoFlush?: boolean;
    source?: string;
    req?: any;
    token: string | undefined
    dataset: string| undefined; 
  };