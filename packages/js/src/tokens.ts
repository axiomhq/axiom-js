import {
  createAPIToken,
  deleteAPIToken,
  getAPIToken,
  getAPITokens,
  regenerateAPIToken,
} from './generated/v2/tokens/tokens.js';
import type {
  APIToken,
  CreateAPIToken,
  CreateAPITokenResponse,
  DatasetCapabilities,
  OrgCapabilities,
  RegenerateAPIToken,
  ViewCapabilities,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace tokens {
  export type Token = APIToken;
  export type CreateRequest = CreateAPIToken;
  export type CreateResponse = CreateAPITokenResponse;
  export type RegenerateRequest = RegenerateAPIToken;
  export type DatasetPermissions = DatasetCapabilities;
  export type OrganizationPermissions = OrgCapabilities;
  export type ViewPermissions = ViewCapabilities;

  const encodePath = (value: string): string => encodeURIComponent(value);

  export class Service extends HTTPClient {
    list = (): Promise<Token[]> => getAPITokens({ axiomClient: this.client });

    get = (id: string): Promise<Token> => getAPIToken(encodePath(id), { axiomClient: this.client });

    create = (request: CreateRequest): Promise<CreateResponse> => createAPIToken(request, { axiomClient: this.client });

    delete = async (id: string): Promise<void> => {
      await deleteAPIToken(encodePath(id), { axiomClient: this.client });
    };

    regenerate = (id: string, request: RegenerateRequest): Promise<CreateResponse> =>
      regenerateAPIToken(encodePath(id), request, { axiomClient: this.client });
  }
}
