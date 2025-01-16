import { Transport } from ".";

export class ConsoleTransport implements Transport {
  log: Transport["log"] = (logs) => {
    logs.forEach((log) => {
      console.log(log);
    });
  };

  flush() {
    return;
  }
}
