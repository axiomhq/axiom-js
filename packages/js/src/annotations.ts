import {
  createAnnotation,
  deleteAnnotation,
  getAnnotation,
  getAnnotations,
  updateAnnotation,
} from './generated/v2/annotations/annotations.js';
import type {
  Annotation as GeneratedAnnotation,
  GetAnnotationsParams,
  NewAnnotation,
  UpdatedAnnotation,
} from './generated/v2/client.schemas.js';
import HTTPClient from './httpClient.js';

export namespace annotations {
  export type Annotation = GeneratedAnnotation;
  export type ListingQueryParams = GetAnnotationsParams;
  export type CreateRequest = NewAnnotation;
  export type UpdateRequest = UpdatedAnnotation;

  export class Service extends HTTPClient {
    private readonly requestOptions = () => ({ axiomClient: this.client });

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getAnnotations
     */
    list = (req?: ListingQueryParams): Promise<Annotation[]> => getAnnotations(req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/getAnnotation
     */
    get = (id: string): Promise<Annotation> => getAnnotation(encodeURIComponent(id), this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/createAnnotation
     */
    create = (req: CreateRequest): Promise<Annotation> => createAnnotation(req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/updateAnnotation
     */
    update = (id: string, req: UpdateRequest): Promise<Annotation> =>
      updateAnnotation(encodeURIComponent(id), req, this.requestOptions());

    /**
     * @see https://axiom.co/docs/restapi/endpoints/deleteAnnotation
     */
    delete = (id: string): Promise<void> => deleteAnnotation(encodeURIComponent(id), this.requestOptions());
  }
}
