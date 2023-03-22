import { LogEvent } from "./logger";

export interface Transport {
    log(event: LogEvent): Promise<void>;
    flush(): Promise<void>;
}
