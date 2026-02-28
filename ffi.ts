import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import koffi from 'koffi';

import { DEFAULT_DLL_NAME, ENV_DM_API_PATH } from './constants.js';
import type { DmApiFunctions } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LICENSE_CALLBACK_PROTO = koffi.proto('LicenseCallback', 'void', []);
export const LICENSE_CALLBACK_POINTER_TYPE = koffi.pointer(LICENSE_CALLBACK_PROTO);

let lib: koffi.IKoffiLib | null = null;
let funcs: DmApiFunctions | null = null;

function resolveDllPath(dllPath: string | null = null): string {
  const resolved = dllPath || process.env[ENV_DM_API_PATH] || DEFAULT_DLL_NAME;
  if (path.isAbsolute(resolved)) {
    return resolved;
  }

  const candidates = [
    path.join(__dirname, resolved),
    path.join(path.dirname(__dirname), resolved),
  ];
  const existing = candidates.find((candidate) => fs.existsSync(candidate));
  return existing || candidates[0];
}

export function ensureLibLoaded(dllPath: string | null = null): DmApiFunctions {
  if (!lib || !funcs) {
    lib = koffi.load(resolveDllPath(dllPath));

    const freeString = lib.func('DM_FreeString', 'void', ['void *']);
    const managedString = koffi.disposable('DmManagedString', 'str', (ptr: unknown) => {
      if (ptr) {
        freeString(ptr);
      }
    });

    funcs = {
      freeString,
      getLastError: lib.func('DM_GetLastError', managedString, []),

      checkForUpdates: lib.func('DM_CheckForUpdates', managedString, ['str']),
      downloadUpdate: lib.func('DM_DownloadUpdate', managedString, ['str']),
      cancelUpdateDownload: lib.func('DM_CancelUpdateDownload', managedString, ['str']),
      getUpdateState: lib.func('DM_GetUpdateState', managedString, []),
      getPostUpdateInfo: lib.func('DM_GetPostUpdateInfo', managedString, []),
      ackPostUpdateInfo: lib.func('DM_AckPostUpdateInfo', managedString, ['str']),
      waitForUpdateStateChange: lib.func('DM_WaitForUpdateStateChange', managedString, ['uint64', 'uint32']),
      quitAndInstall: lib.func('DM_QuitAndInstall', 'int32', ['str']),
      jsonToCanonical: lib.func('DM_JsonToCanonical', managedString, ['str']),

      setProductData: lib.func('SetProductData', 'int32', ['str']),
      setProductId: lib.func('SetProductId', 'int32', ['str']),
      setDataDirectory: lib.func('SetDataDirectory', 'int32', ['str']),
      setDebugMode: lib.func('SetDebugMode', 'int32', ['uint32']),
      setCustomDeviceFingerprint: lib.func('SetCustomDeviceFingerprint', 'int32', ['str']),

      setLicenseKey: lib.func('SetLicenseKey', 'int32', ['str']),
      setLicenseCallback: lib.func('SetLicenseCallback', 'int32', [LICENSE_CALLBACK_POINTER_TYPE]),
      activateLicense: lib.func('ActivateLicense', 'int32', []),
      getLastActivationError: lib.func('GetLastActivationError', 'int32', ['pointer']),

      isLicenseGenuine: lib.func('IsLicenseGenuine', 'int32', []),
      isLicenseValid: lib.func('IsLicenseValid', 'int32', []),
      getServerSyncGracePeriodExpiryDate: lib.func('GetServerSyncGracePeriodExpiryDate', 'int32', ['pointer']),
      getActivationMode: lib.func('GetActivationMode', 'int32', ['pointer', 'uint32', 'pointer', 'uint32']),

      getLicenseKey: lib.func('GetLicenseKey', 'int32', ['pointer', 'uint32']),
      getLicenseExpiryDate: lib.func('GetLicenseExpiryDate', 'int32', ['pointer']),
      getLicenseCreationDate: lib.func('GetLicenseCreationDate', 'int32', ['pointer']),
      getLicenseActivationDate: lib.func('GetLicenseActivationDate', 'int32', ['pointer']),
      getActivationCreationDate: lib.func('GetActivationCreationDate', 'int32', ['pointer']),
      getActivationLastSyncedDate: lib.func('GetActivationLastSyncedDate', 'int32', ['pointer']),
      getActivationId: lib.func('GetActivationId', 'int32', ['pointer', 'uint32']),

      getLibraryVersion: lib.func('GetLibraryVersion', 'str', []),
      reset: lib.func('Reset', 'int32', []),
    };
  }

  return funcs;
}
