import HTTPClient from './httpClient.js';

export namespace annotations {
  export interface Annotation {
    id: string;
    type: string;
    datasets: string[];
    title?: string;
    description?: string;
    url?: string;
    time: string;
    endTime?: string;
  }

  export interface ListingQueryParams {
    datasets?: string[];
    start?: string;
    end?: string;
  }

  export interface CreateRequest {
    type: string;
    datasets: string[];
    title?: string;
    description?: string;
    url?: string;
    time?: string;
    endTime?: string;
  }

  export interface UpdateRequest {
    type?: string;
    datasets?: string[];
    title?: string;
    description?: string;
    url?: string;
    time?: string;
    endTime?: string;
  }

  export class Service extends HTTPClient {
    private readonly localPath = '/v2/annotations';

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getAnnotations
     */
    list = (req?: ListingQueryParams): Promise<Annotation[]> => this.client.get(this.localPath, {}, req);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getAnnotation
     */
    get = (id: string): Promise<Annotation> => this.client.get(this.localPath + '/' + id);

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createAnnotation
     */
    create = (req: CreateRequest): Promise<Annotation> =>
      this.client.post(this.localPath, { body: JSON.stringify(req) });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateAnnotation
     */
    update = (id: string, req: UpdateRequest): Promise<Annotation> =>
      this.client.put(this.localPath + '/' + id, { body: JSON.stringify(req) });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteAnnotation
     */
    delete = (id: string): Promise<Response> => this.client.delete(this.localPath + '/' + id);
  }
}
