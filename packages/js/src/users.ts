import {
  createUser,
  getCurrentUser,
  getUser,
  getUsers,
  removeUserFromOrg,
  updateCurrentUser,
  updateUserRole,
} from './generated/v2/users/users.js';
import type {
  CreateUserRequest,
  User as GeneratedUser,
  UpdateCurrentUserRequest,
  UpdateUserRoleRequest,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace users {
  const encodePath = (value: string): string => encodeURIComponent(value);

  export type User = GeneratedUser;
  export type UserRole = GeneratedUser['role'];
  export type CreateRequest = CreateUserRequest;
  export type UpdateCurrentRequest = UpdateCurrentUserRequest;
  export type UpdateRoleRequest = UpdateUserRoleRequest;

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getCurrentUser
     */
    current = (): Promise<User> => getCurrentUser(this.requestOptions());

    updateCurrent = (request: UpdateCurrentRequest): Promise<User> =>
      updateCurrentUser(request, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getUsers
     */
    list = (): Promise<User[]> => getUsers(this.requestOptions());

    create = (request: CreateRequest): Promise<User> => createUser(request, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getUser
     */
    get = (id: string): Promise<User> => getUser(encodePath(id), this.requestOptions());

    remove = (id: string): Promise<void> => removeUserFromOrg(encodePath(id), this.requestOptions());

    updateRole = (id: string, request: UpdateRoleRequest): Promise<User> =>
      updateUserRole(encodePath(id), request, this.requestOptions());
  }
}
