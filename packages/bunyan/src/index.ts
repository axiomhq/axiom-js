import { Axiom } from '@axiomhq/js';

export enum AxiomEventLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Silent = 'silent',
}

enum RecordLevel {
  trace = 10,
  debug = 20,
  info = 30,
  warn = 40,
  error = 50,
  fatal = 60,
}

const noop = () => {};

export class AxiomStream<T extends { msg: string; level: RecordLevel; time: Date }> {
  private axiom: Axiom;
  dataset: any;
  token: any;
  orgId?: any;
  onError: (err: unknown) => void;

  constructor(
    opt: Omit<AxiomStream<T>, 'write' | 'onError' | 'close'> & {
      onError?: AxiomStream<T>['onError'];
    },
  ) {
    if (!opt.dataset) {
      throw new Error('dataset requried');
    }

    if (!opt.token) {
      throw new Error('token requried');
    }

    this.orgId = opt.orgId;
    this.token = opt.token;
    this.onError = opt.onError || noop;
    this.dataset = opt.dataset;

    this.axiom = new Axiom({
      orgId: this?.orgId,
      token: this.token,
    });
  }

  async write(record: Object) {
    try {
      const parsedRecord = typeof record === 'string' ? (JSON.parse(record) as T) : (record as T);
      const { time, level, msg, ...rest } = parsedRecord;
      const event = {
        _time: time,
        message: msg,
        level: this.getLogLevel(level),
        ...rest,
      };

      this.axiom.ingest(this.dataset, event);
    } catch (err) {
      this.onError(err);
    }
  }

  private getLogLevel(level: number) {
    if (level <= 10) {
      return AxiomEventLevel.Trace;
    }
    if (level <= 20) {
      return AxiomEventLevel.Debug;
    }
    if (level <= 30) {
      return AxiomEventLevel.Info;
    }
    if (level <= 40) {
      return AxiomEventLevel.Warn;
    }
    if (level <= 50) {
      return AxiomEventLevel.Error;
    }
    if (level <= 60) {
      return AxiomEventLevel.Fatal;
    }

    return AxiomEventLevel.Silent;
  }

  async close() {
    await this.axiom.flush();
  }
}
