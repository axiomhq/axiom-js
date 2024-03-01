export interface LogEvent {
  level: string;
  message: string;
  fields: any;
  _time: string;
  [key: string]: any;
}
