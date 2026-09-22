import { createGroup, deleteGroup, getGroupById, listGroups, updateGroup } from './generated/v2/rbac/rbac.js';
import type { Group as GeneratedGroup, GroupWithID } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace groups {
  export type Group = GroupWithID;
  export type CreateRequest = Omit<GeneratedGroup, 'isManaged'>;
  export type UpdateRequest = CreateRequest;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (): Promise<Group[]> => listGroups(this.requestOptions());

    get = (id: string): Promise<Group> => getGroupById(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<Group> => createGroup(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<Group> =>
      updateGroup(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteGroup(encodePath(id), this.requestOptions());
  }
}
