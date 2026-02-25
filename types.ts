import type koffi from 'koffi';

export type JsonMap = Record<string, unknown>;

export interface DllResponse<T> {
  data?: T;
}

export interface DmApiOptions {
  dllPath?: string | null;
  pipeTimeoutMs?: number;
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
  connect: koffi.KoffiFunction;
  close: koffi.KoffiFunction;
  getVersion: koffi.KoffiFunction;
  getLastError: koffi.KoffiFunction;
  restartAppIfNecessary: koffi.KoffiFunction;
  checkForUpdates: koffi.KoffiFunction;
  downloadUpdate: koffi.KoffiFunction;
  getUpdateState: koffi.KoffiFunction;
  waitForUpdateStateChange: koffi.KoffiFunction;
  quitAndInstall: koffi.KoffiFunction;
  jsonToCanonical: koffi.KoffiFunction;

  setProductData: koffi.KoffiFunction;
  setProductId: koffi.KoffiFunction;
  setDataDirectory: koffi.KoffiFunction;
  setDebugMode: koffi.KoffiFunction;
  setCustomDeviceFingerprint: koffi.KoffiFunction;

  setLicenseKey: koffi.KoffiFunction;
  setActivationMetadata: koffi.KoffiFunction;
  activateLicense: koffi.KoffiFunction;
  activateLicenseOffline: koffi.KoffiFunction;
  generateOfflineDeactivationRequest: koffi.KoffiFunction;
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
