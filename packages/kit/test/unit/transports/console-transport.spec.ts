import { jest, describe, expect, it } from '@jest/globals';
import { ConsoleTransport } from '../../../src/transports/console.transport';

const mockedLog = jest.spyOn(global.console, 'log');

describe('ConsoleTransport tests', () => {
  it('should print to console immediately', () => {
    const transport = new ConsoleTransport();
    const ev = { _time: Date.now().toString(), level: 'info', message: 'hello, world!', fields: {} };
    transport.log(ev);
    expect(mockedLog).toHaveBeenCalledTimes(1);
  });
});
