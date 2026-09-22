import { createOrg, getOrg, getOrgs, updateOrg } from './generated/v2/orgs/orgs.js';
import type { Org as GeneratedOrg, PostOrg, UpdateOrg } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace orgs {
  export type Organization = GeneratedOrg;
  export type Org = Organization;
  export type CreateRequest = PostOrg;
  export type UpdateRequest = UpdateOrg;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (): Promise<Organization[]> => getOrgs(this.requestOptions());

    get = (id: string): Promise<Organization> => getOrg(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<Organization> => createOrg(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<Organization> =>
      updateOrg(encodePath(id), request, this.requestOptions());
  }
}
