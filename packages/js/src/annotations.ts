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
        datasets?: string[],
        start?: string,
        end?: string
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

        list = (req?: ListingQueryParams): Promise<Annotation[]> => this.client.get(this.localPath, {}, req);

        get = (id: string): Promise<Annotation> => this.client.get(this.localPath + '/' + id);

        create = (req: CreateRequest): Promise<Annotation> => this.client.post(this.localPath, { body: JSON.stringify(req) });

        update = (id: string, req: UpdateRequest): Promise<Annotation> =>
            this.client.put(this.localPath + '/' + id, { body: JSON.stringify(req) });

        delete = (id: string): Promise<Response> => this.client.delete(this.localPath + '/' + id);
    }
}
