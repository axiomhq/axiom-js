import { createHmac, Hmac, KeyObject } from 'crypto';
import { parse as uuidParse } from 'uuid';

import { datasets } from './datasets';

export namespace sas {
    export interface Filter {
        op: datasets.FilterOp; // op = Operation
        fd: string; // fd = Field
        vl: any; // vl = Value
        cs: boolean; // cs = Case Sensitive
        ch?: Array<Filter>; // ch = Children
    }

    export interface Options {
        organizationId: string;
        dataset: string;
        filter: datasets.Filter | string; // Filter or APL filter statement
        minStartTime: string; // RFC3339 timestamp or APL date-time expression
        maxEndTime: string; // RFC3339 timestamp or APL date-time expression
    }

    export class Signature {
        static create(keyStr: string, options: Options): string {
            const key = new Uint8Array(uuidParse(keyStr));

            const params = optionsToURLSearchParams(options);
            console.log(params);

            // Signature payload is the newline delimited concatenation of the
            // options fields in the order they appear.
            const signaturePayloadValues: Array<string> = [];
            params.forEach((value) => {
                signaturePayloadValues.push(value);
            });
            const signaturePayload = signaturePayloadValues.join('\n');

            const token = createHmac('sha256', key).update(signaturePayload).digest('base64url');

            params.append('tk', token);
            params.sort();

            return params.toString();
        }
    }

    function filterFromDatasetsFilter(filter: datasets.Filter): Filter {
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
            fl:
                typeof options.filter === "string" ? options.filter as string :
                    JSON.stringify(filterFromDatasetsFilter(options.filter as datasets.Filter)),
            mst: options.minStartTime,
            met: options.maxEndTime,
        });
    }
}
