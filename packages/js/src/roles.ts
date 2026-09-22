import { createRole, deleteRole, getRoleById, listRoles, updateRole } from './generated/v2/rbac/rbac.js';
import type { Role as GeneratedRole, RoleWithID } from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace roles {
  export type Role = RoleWithID;
  export type CreateRequest = GeneratedRole;
  export type UpdateRequest = GeneratedRole;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    list = (): Promise<Role[]> => listRoles(this.requestOptions());

    get = (id: string): Promise<Role> => getRoleById(encodePath(id), this.requestOptions());

    create = (request: CreateRequest): Promise<Role> => createRole(request, this.requestOptions());

    update = (id: string, request: UpdateRequest): Promise<Role> =>
      updateRole(encodePath(id), request, this.requestOptions());

    delete = (id: string): Promise<void> => deleteRole(encodePath(id), this.requestOptions());
  }
}
