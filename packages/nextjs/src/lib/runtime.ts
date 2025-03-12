export const Version = __PACKAGE_VERSION__;

declare global {
  const __PACKAGE_VERSION__: string;
  var WorkerGlobalScope: any;
}
