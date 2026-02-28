# dm-api-typescript

TypeScript SDK for DistroMate `dm_api` native library.

## Install

```bash
npm install @distromate/dm-api
```

## Quick Start (License)

```typescript
import { DmApi } from '@distromate/dm-api';

const api = new DmApi();

api.setProductData('<product-data>');
api.setProductId('your-product-id');
api.setLicenseKey('XXXX-XXXX-XXXX');

if (!api.activateLicense()) {
  throw new Error(api.getLastError() || 'activation failed');
}

if (!api.isLicenseGenuine()) {
  const code = api.getLastActivationError();
  const name = api.getActivationErrorName(code);
  throw new Error(`license check failed: ${name}, err=${api.getLastError()}`);
}
```

## API Groups

- License setup: `setProductData`, `setProductId`, `setDataDirectory`, `setDebugMode`, `setCustomDeviceFingerprint`
- License activation: `setLicenseKey`, `setLicenseCallback`, `activateLicense`, `getLastActivationError`
- License state: `isLicenseGenuine`, `isLicenseValid`, `getServerSyncGracePeriodExpiryDate`, `getActivationMode`
- License details: `getLicenseKey`, `getLicenseExpiryDate`, `getLicenseCreationDate`, `getLicenseActivationDate`, `getActivationCreationDate`, `getActivationLastSyncedDate`, `getActivationId`
- Update: `checkForUpdates`, `downloadUpdate`, `cancelUpdateDownload`, `getUpdateState`, `getPostUpdateInfo`, `ackPostUpdateInfo`, `waitForUpdateStateChange`, `quitAndInstall`
- General: `getLibraryVersion`, `jsonToCanonical`, `getLastError`, `reset`

## Update API Notes

- Update APIs return parsed JSON envelope (`UpdateEnvelope`) when transport succeeds.
- If native API returns `NULL`, TypeScript SDK returns `null`; check `getLastError()`.
- `quitAndInstall()` returns native `number` status directly:
  - `1`: accepted, process should exit soon
  - `-1`: business-level rejection (check `getLastError()`)
  - `-2`: transport/parse error

## Environment Variables

- `DM_API_PATH`: optional path to native library
- `DM_APP_ID`, `DM_PUBLIC_KEY`: optional defaults for app identity
- `DM_LAUNCHER_ENDPOINT`, `DM_LAUNCHER_TOKEN`: launcher IPC variables used by update APIs

## Release

- CI checks type build and package generation.
- Tag `v*` triggers npm publish.
- Required secret: `NPM_TOKEN`.
