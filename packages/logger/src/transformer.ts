import { LogEvent } from "./event";

export interface Transformer {
  transform(event: LogEvent): LogEvent;
}
