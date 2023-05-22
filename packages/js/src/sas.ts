import { createHmac } from 'crypto';
import { parse as uuidParse } from 'uuid';

import { Filter as AxiomFilter, FilterOp } from './client';

export namespace sas {
  export interface Options {
    organizationId: string;
    dataset: string;
    filter: AxiomFilter | string; // Filter or APL filter statement
    minStartTime: string; // RFC3339 timestamp or APL date-time expression
    maxEndTime: string; // RFC3339 timestamp or APL date-time expression
  }

  export class Signature {
    static create(keyStr: string, options: Options): string {
      const key = new Uint8Array(uuidParse(keyStr));

      const params = optionsToURLSearchParams(options);

      // Signature payload is the newline delimited concatenation of the
      // options fields in the order they appear.
      const signaturePayloadValues: Array<string> = [];
      params.forEach((value) => {
        signaturePayloadValues.push(value);
      });
      const signaturePayload = signaturePayloadValues.join('\n');

      const token = createHmac('sha256', key).update(signaturePayload).digest('base64url');

      params.append('tk', base64AddPadding(token));
      params.sort();

      return params.toString();
    }
  }

  // No need to export filter as this is just in place to produce shorter json
  // field names.
  interface Filter {
    op: FilterOp; // op = Operation
    fd: string; // fd = Field
    vl: any; // vl = Value
    cs: boolean; // cs = Case Sensitive
    ch?: Array<Filter>; // ch = Children
  }

  function filterFromDatasetsFilter(filter: AxiomFilter): Filter {
    return {
      op: filter.op,
      fd: filter.field,
      vl: filter.value,
      cs: filter.caseSensitive || false,
      ch: filter.children ? filter.children.map(filterFromDatasetsFilter) : undefined,
    };
  }

  function optionsToURLSearchParams(options: Options): URLSearchParams {
    return new URLSearchParams({
      oi: options.organizationId,
      dt: options.dataset,
      fl: isFilter(options.filter) ? JSON.stringify(filterFromDatasetsFilter(options.filter)) : options.filter,
      mst: options.minStartTime,
      met: options.maxEndTime,
    });
  }

  function isFilter(filter: AxiomFilter | string): filter is AxiomFilter {
    return Object.prototype.hasOwnProperty.call(filter, 'op');
  }

  function base64AddPadding(str: string): string {
    return str + Array(((4 - (str.length % 4)) % 4) + 1).join('=');
  }
}
