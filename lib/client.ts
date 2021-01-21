import axiosStatic, { AxiosStatic } from 'axios';

axiosStatic.defaults.timeout = 30000;

export class AxiomClient {
    axios: AxiosStatic;
    basePath: string;

    constructor(axios: AxiosStatic = axiosStatic, basePath: string) {
        this.axios = axios;
        this.basePath = basePath;
    }
}
