import {
  createNotifier,
  deleteNotifier,
  getNotifier,
  getNotifiers,
  updateNotifier,
} from './generated/v2/monitors/monitors.js';
import type { Notifier as GeneratedNotifier, NotifierWithId } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace notifiers {
  export type Notifier = NotifierWithId;
  export type CreateRequest = Omit<GeneratedNotifier, 'createdAt' | 'createdBy' | 'updatedAt'>;
  export type UpdateRequest = CreateRequest;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (): Promise<Notifier[]> => getNotifiers(this.requestOptions());

    get = (id: string): Promise<Notifier> => getNotifier(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<Notifier> => createNotifier(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<Notifier> =>
      updateNotifier(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteNotifier(encodePath(id), this.requestOptions());
  }
}
