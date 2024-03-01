import { LogEvent } from "./event";

export interface Transport {
  log(event: LogEvent): void;
  flush(): Promise<any>;
}
