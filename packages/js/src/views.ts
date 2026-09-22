import { createView, deleteView, getView, getViews, updateView } from './generated/v2/views/views.js';
import type { View as GeneratedView, ViewBody } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace views {
  export type View = GeneratedView;
  export type CreateRequest = ViewBody;
  export type UpdateRequest = ViewBody;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (): Promise<View[]> => getViews(this.requestOptions());

    get = (id: string): Promise<View> => getView(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<View> => createView(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<View> =>
      updateView(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteView(encodePath(id), this.requestOptions());
  }
}
