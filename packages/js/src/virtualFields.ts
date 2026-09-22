import {
  createVirtualField,
  deleteVirtualField,
  getVirtualField,
  getVirtualFields,
  updateVirtualField,
} from './generated/v2/vfields/vfields.js';
import type { GetVirtualFieldsParams, VirtualFieldBody, VirtualFieldWithId } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace virtualFields {
  export type VirtualField = VirtualFieldWithId;
  export type CreateRequest = VirtualFieldBody;
  export type UpdateRequest = VirtualFieldBody;
  export type ListOptions = GetVirtualFieldsParams;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (options: ListOptions): Promise<VirtualField[]> => getVirtualFields(options, this.requestOptions());

    get = (id: string): Promise<VirtualField> => getVirtualField(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<VirtualField> => createVirtualField(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<VirtualField> =>
      updateVirtualField(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteVirtualField(encodePath(id), this.requestOptions());
  }
}
