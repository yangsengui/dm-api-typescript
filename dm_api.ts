import fs from 'fs';
import os from 'os';
import path from 'path';

import koffi from 'koffi';

import {
  ACTIVATION_ERROR_NAMES,
  DEFAULT_BUFFER_SIZE,
  DEV_LICENSE_ERROR,
  ENV_DM_APP_ID,
  ENV_DM_LAUNCHER_ENDPOINT,
  ENV_DM_LAUNCHER_TOKEN,
  ENV_DM_PUBLIC_KEY,
} from './constants.js';
import { ensureLibLoaded, LICENSE_CALLBACK_POINTER_TYPE } from './ffi.js';
import type {
  ActivationMode,
  DmApiFunctions,
  DmApiOptions,
  JsonMap,
  LicenseCallback,
  ShouldSkipCheckOptions,
  UpdateEnvelope,
} from './types.js';
import { allocBuffer, parseJson, readCString } from './utils.js';

export type {
  ActivationMode,
  DmApiFunctions,
  DmApiOptions,
  JsonMap,
  LicenseCallback,
  ShouldSkipCheckOptions,
  UpdateEnvelope,
} from './types.js';

type UnknownFunction = (...args: unknown[]) => unknown;
type RegisteredCallbackHandle = ReturnType<typeof koffi.register>;

export class DmApi {
  private readonly _funcs: DmApiFunctions;
  private _licenseCallbackHandle: RegisteredCallbackHandle | null = null;

  constructor(options: DmApiOptions = {}) {
    this._funcs = ensureLibLoaded(options.dllPath ?? null);
  }

  static shouldSkipCheck(options: ShouldSkipCheckOptions = {}): boolean {
    if (process.env[ENV_DM_LAUNCHER_ENDPOINT] && process.env[ENV_DM_LAUNCHER_TOKEN]) {
      return false;
    }

    const resolvedAppId = options.appId || process.env[ENV_DM_APP_ID];
    const resolvedPublicKey = options.publicKey || process.env[ENV_DM_PUBLIC_KEY];
    if (!resolvedAppId || !resolvedPublicKey) {
      throw new Error(
        'App identity is required for dev-license checks. Provide appId/publicKey or set DM_APP_ID and DM_PUBLIC_KEY.'
      );
    }

    const pubkeyPath = path.join(
      os.homedir(),
      '.distromate-cli',
      'dev_licenses',
      String(resolvedAppId),
      'pubkey'
    );

    let devPubKey: string;
    try {
      devPubKey = fs.readFileSync(pubkeyPath, 'utf8').trim();
    } catch {
      throw new Error(DEV_LICENSE_ERROR);
    }

    if (!devPubKey || devPubKey !== String(resolvedPublicKey).trim()) {
      throw new Error(DEV_LICENSE_ERROR);
    }

    return true;
  }

  getLastError(): string | null {
    return (this._funcs.getLastError() as string | null) || null;
  }

  getActivationErrorName(code: number | null | undefined): string | null {
    if (code == null) {
      return null;
    }
    return ACTIVATION_ERROR_NAMES[code] || `UNKNOWN(${code})`;
  }

  private _callStatusBool(func: UnknownFunction, ...args: unknown[]): boolean {
    return (func(...args) as number) === 0;
  }

  private _callU32Out(func: (out: Buffer) => unknown): number | null {
    const out = Buffer.alloc(4);
    if ((func(out) as number) !== 0) {
      return null;
    }
    return out.readUInt32LE(0);
  }

  private _callStringOut(
    func: (buffer: Buffer, size: number) => unknown,
    bufferSize: number = DEFAULT_BUFFER_SIZE
  ): string | null {
    const buffer = allocBuffer(bufferSize, DEFAULT_BUFFER_SIZE);
    if ((func(buffer, buffer.length) as number) !== 0) {
      return null;
    }
    return readCString(buffer);
  }

  private _callJsonEnvelope(func: UnknownFunction, ...args: unknown[]): UpdateEnvelope | null {
    const raw = (func(...args) as string | null) || null;
    return parseJson<UpdateEnvelope>(raw);
  }

  private _encodeOptions(options?: JsonMap | null): string | null {
    if (options == null) {
      return null;
    }
    return JSON.stringify(options);
  }

  setProductData(productData: string): boolean {
    return this._callStatusBool(this._funcs.setProductData as UnknownFunction, productData);
  }

  setProductId(productId: string): boolean {
    return this._callStatusBool(this._funcs.setProductId as UnknownFunction, productId);
  }

  setDataDirectory(directoryPath: string): boolean {
    return this._callStatusBool(this._funcs.setDataDirectory as UnknownFunction, directoryPath);
  }

  setDebugMode(enable: boolean): boolean {
    return this._callStatusBool(this._funcs.setDebugMode as UnknownFunction, enable ? 1 : 0);
  }

  setCustomDeviceFingerprint(fingerprint: string): boolean {
    return this._callStatusBool(this._funcs.setCustomDeviceFingerprint as UnknownFunction, fingerprint);
  }

  setLicenseKey(licenseKey: string): boolean {
    return this._callStatusBool(this._funcs.setLicenseKey as UnknownFunction, licenseKey);
  }

  setLicenseCallback(callback: LicenseCallback): boolean {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function');
    }

    const handle = koffi.register(callback, LICENSE_CALLBACK_POINTER_TYPE);
    const ok = this._callStatusBool(this._funcs.setLicenseCallback as UnknownFunction, handle);
    if (!ok) {
      koffi.unregister(handle);
      return false;
    }

    if (this._licenseCallbackHandle) {
      koffi.unregister(this._licenseCallbackHandle);
    }
    this._licenseCallbackHandle = handle;
    return true;
  }

  activateLicense(): boolean {
    return this._callStatusBool(this._funcs.activateLicense as UnknownFunction);
  }

  getLastActivationError(): number | null {
    return this._callU32Out(this._funcs.getLastActivationError as (out: Buffer) => unknown);
  }

  isLicenseGenuine(): boolean {
    return this._callStatusBool(this._funcs.isLicenseGenuine as UnknownFunction);
  }

  isLicenseValid(): boolean {
    return this._callStatusBool(this._funcs.isLicenseValid as UnknownFunction);
  }

  getServerSyncGracePeriodExpiryDate(): number | null {
    return this._callU32Out(this._funcs.getServerSyncGracePeriodExpiryDate as (out: Buffer) => unknown);
  }

  getActivationMode(bufferSize: number = 64): ActivationMode | null {
    const initial = allocBuffer(bufferSize, 64);
    const current = allocBuffer(bufferSize, 64);
    const result = (this._funcs.getActivationMode as UnknownFunction)(
      initial,
      initial.length,
      current,
      current.length
    ) as number;
    if (result !== 0) {
      return null;
    }

    return {
      initial_mode: readCString(initial),
      current_mode: readCString(current),
    };
  }

  getLicenseKey(bufferSize: number = DEFAULT_BUFFER_SIZE): string | null {
    return this._callStringOut(this._funcs.getLicenseKey as (buffer: Buffer, size: number) => unknown, bufferSize);
  }

  getLicenseExpiryDate(): number | null {
    return this._callU32Out(this._funcs.getLicenseExpiryDate as (out: Buffer) => unknown);
  }

  getLicenseCreationDate(): number | null {
    return this._callU32Out(this._funcs.getLicenseCreationDate as (out: Buffer) => unknown);
  }

  getLicenseActivationDate(): number | null {
    return this._callU32Out(this._funcs.getLicenseActivationDate as (out: Buffer) => unknown);
  }

  getActivationCreationDate(): number | null {
    return this._callU32Out(this._funcs.getActivationCreationDate as (out: Buffer) => unknown);
  }

  getActivationLastSyncedDate(): number | null {
    return this._callU32Out(this._funcs.getActivationLastSyncedDate as (out: Buffer) => unknown);
  }

  getActivationId(bufferSize: number = DEFAULT_BUFFER_SIZE): string | null {
    return this._callStringOut(this._funcs.getActivationId as (buffer: Buffer, size: number) => unknown, bufferSize);
  }

  reset(): boolean {
    return this._callStatusBool(this._funcs.reset as UnknownFunction);
  }

  checkForUpdates(options: JsonMap | null = null): UpdateEnvelope | null {
    return this._callJsonEnvelope(this._funcs.checkForUpdates as UnknownFunction, this._encodeOptions(options));
  }

  downloadUpdate(options: JsonMap | null = null): UpdateEnvelope | null {
    return this._callJsonEnvelope(this._funcs.downloadUpdate as UnknownFunction, this._encodeOptions(options));
  }

  cancelUpdateDownload(options: JsonMap | null = null): UpdateEnvelope | null {
    return this._callJsonEnvelope(
      this._funcs.cancelUpdateDownload as UnknownFunction,
      this._encodeOptions(options)
    );
  }

  getUpdateState(): UpdateEnvelope | null {
    return this._callJsonEnvelope(this._funcs.getUpdateState as UnknownFunction);
  }

  getPostUpdateInfo(): UpdateEnvelope | null {
    return this._callJsonEnvelope(this._funcs.getPostUpdateInfo as UnknownFunction);
  }

  ackPostUpdateInfo(options: JsonMap | null = null): UpdateEnvelope | null {
    return this._callJsonEnvelope(this._funcs.ackPostUpdateInfo as UnknownFunction, this._encodeOptions(options));
  }

  waitForUpdateStateChange(lastSequence: number, timeoutMs: number = 30000): UpdateEnvelope | null {
    const sequence = Math.max(0, Math.floor(Number(lastSequence) || 0));
    const timeout = Math.max(0, Math.floor(Number(timeoutMs) || 0));
    return this._callJsonEnvelope(this._funcs.waitForUpdateStateChange as UnknownFunction, sequence, timeout);
  }

  quitAndInstall(options: JsonMap | null = null): number {
    return Number((this._funcs.quitAndInstall as UnknownFunction)(this._encodeOptions(options)));
  }

  getLibraryVersion(): string {
    return (this._funcs.getLibraryVersion() as string) || '';
  }

  jsonToCanonical(jsonStr: string): string | null {
    return ((this._funcs.jsonToCanonical as UnknownFunction)(jsonStr) as string | null) || null;
  }

  static jsonToCanonical(jsonStr: string, options: Pick<DmApiOptions, 'dllPath'> = {}): string | null {
    const loaded = ensureLibLoaded(options.dllPath ?? null);
    return ((loaded.jsonToCanonical as UnknownFunction)(jsonStr) as string | null) || null;
  }
}
