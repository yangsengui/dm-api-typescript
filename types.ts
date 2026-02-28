import type koffi from 'koffi';

export type JsonMap = Record<string, unknown>;

export type LicenseCallback = () => void;

export interface UpdateEnvelope<TData extends JsonMap = JsonMap> {
  id?: string;
  type?: string;
  data?: TData;
}

export interface DmApiOptions {
  dllPath?: string | null;
}

export interface ShouldSkipCheckOptions {
  appId?: string | null;
  publicKey?: string | null;
}

export interface ActivationMode {
  initial_mode: string;
  current_mode: string;
}

export interface DmApiFunctions {
  freeString: koffi.KoffiFunction;
  getLastError: koffi.KoffiFunction;

  checkForUpdates: koffi.KoffiFunction;
  downloadUpdate: koffi.KoffiFunction;
  cancelUpdateDownload: koffi.KoffiFunction;
  getUpdateState: koffi.KoffiFunction;
  getPostUpdateInfo: koffi.KoffiFunction;
  ackPostUpdateInfo: koffi.KoffiFunction;
  waitForUpdateStateChange: koffi.KoffiFunction;
  quitAndInstall: koffi.KoffiFunction;
  jsonToCanonical: koffi.KoffiFunction;

  setProductData: koffi.KoffiFunction;
  setProductId: koffi.KoffiFunction;
  setDataDirectory: koffi.KoffiFunction;
  setDebugMode: koffi.KoffiFunction;
  setCustomDeviceFingerprint: koffi.KoffiFunction;

  setLicenseKey: koffi.KoffiFunction;
  setLicenseCallback: koffi.KoffiFunction;
  activateLicense: koffi.KoffiFunction;
  getLastActivationError: koffi.KoffiFunction;

  isLicenseGenuine: koffi.KoffiFunction;
  isLicenseValid: koffi.KoffiFunction;
  getServerSyncGracePeriodExpiryDate: koffi.KoffiFunction;
  getActivationMode: koffi.KoffiFunction;

  getLicenseKey: koffi.KoffiFunction;
  getLicenseExpiryDate: koffi.KoffiFunction;
  getLicenseCreationDate: koffi.KoffiFunction;
  getLicenseActivationDate: koffi.KoffiFunction;
  getActivationCreationDate: koffi.KoffiFunction;
  getActivationLastSyncedDate: koffi.KoffiFunction;
  getActivationId: koffi.KoffiFunction;

  getLibraryVersion: koffi.KoffiFunction;
  reset: koffi.KoffiFunction;
}
