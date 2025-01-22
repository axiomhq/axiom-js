import HTTPClient from "./httpClient.js";

export namespace users {
  export interface User {
    id: string;
    name: string;
    emails: Array<string>;
  }

  export class Service extends HTTPClient {
    current = (): Promise<User> => this.client.get("/v1/user");
  }
}
