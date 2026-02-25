import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  DEFAULT_BUFFER_SIZE,
  DEFAULT_PIPE_TIMEOUT_MS,
  DEV_LICENSE_ERROR,
} from './constants.js';
import { ensureLibLoaded } from './ffi.js';
import type {
  ActivationMode,
  DllResponse,
  DmApiOptions,
  DmApiFunctions,
  JsonMap,
  ShouldSkipCheckOptions,
} from './types.js';
import { allocBuffer, parseJson, readCString } from './utils.js';

export type {
  ActivationMode,
  DllResponse,
  DmApiOptions,
  DmApiFunctions,
  JsonMap,
  ShouldSkipCheckOptions,
} from './types.js';

export class DmApi {
  private readonly _funcs: DmApiFunctions;
  private readonly _pipeTimeoutMs: number;

  constructor(options: DmApiOptions = {}) {
    this._funcs = ensureLibLoaded(options.dllPath ?? null);
    this._pipeTimeoutMs = Math.max(
      0,
      Math.floor(Number(options.pipeTimeoutMs ?? DEFAULT_PIPE_TIMEOUT_MS) || 0)
    );
  }

  static shouldSkipCheck(options: ShouldSkipCheckOptions = {}): boolean {
    if (process.env.DM_PIPE && process.env.DM_API_PATH) {
      return false;
    }

    const resolvedAppId = options.appId || process.env.DM_APP_ID;
    const resolvedPublicKey = options.publicKey || process.env.DM_PUBLIC_KEY;
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

  getVersion(): string {
    return (this._funcs.getVersion() as string) || '';
  }

  getLastError(): string | null {
    return (this._funcs.getLastError() as string | null) || null;
  }

  restartAppIfNecessary(): boolean {
    return (this._funcs.restartAppIfNecessary() as number) !== 0;
  }

  private _resolvePipe(): string | null {
    return process.env.DM_PIPE || null;
  }

  private _withPipe<T>(callback: () => T | null): T | null {
    const pipe = this._resolvePipe();
    if (!pipe) {
      return null;
    }

    if ((this._funcs.connect(pipe, this._pipeTimeoutMs) as number) !== 0) {
      return null;
    }

    try {
      return callback();
    } finally {
      this._funcs.close();
    }
  }

  private _callStatusBool(func: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
    return (func(...args) as number) === 0;
  }

  private _callU32Out(func: (out: Buffer) => unknown): number | null {
    const out = Buffer.alloc(4);
    if ((func(out) as number) !== 0) {
      return null;
    }
    return out.readUInt32LE(0);
  }

  private _callStringOut(func: (buffer: Buffer, size: number) => unknown, bufferSize: number = DEFAULT_BUFFER_SIZE): string | null {
    const buffer = allocBuffer(bufferSize);
    if ((func(buffer, buffer.length) as number) !== 0) {
      return null;
    }
    return readCString(buffer);
  }

  setProductData(productData: string): boolean {
    return this._callStatusBool(this._funcs.setProductData as (...args: unknown[]) => unknown, productData);
  }

  setProductId(productId: string, flags: number = 0): boolean {
    const normalizedFlags = Math.max(0, Math.floor(Number(flags) || 0));
    return this._callStatusBool(
      this._funcs.setProductId as (...args: unknown[]) => unknown,
      productId,
      normalizedFlags
    );
  }

  setDataDirectory(directoryPath: string): boolean {
    return this._callStatusBool(
      this._funcs.setDataDirectory as (...args: unknown[]) => unknown,
      directoryPath
    );
  }

  setDebugMode(enable: boolean): boolean {
    return this._callStatusBool(
      this._funcs.setDebugMode as (...args: unknown[]) => unknown,
      enable ? 1 : 0
    );
  }

  setCustomDeviceFingerprint(fingerprint: string): boolean {
    return this._callStatusBool(
      this._funcs.setCustomDeviceFingerprint as (...args: unknown[]) => unknown,
      fingerprint
    );
  }

  setLicenseKey(licenseKey: string): boolean {
    return this._callStatusBool(this._funcs.setLicenseKey as (...args: unknown[]) => unknown, licenseKey);
  }

  setActivationMetadata(key: string, value: string): boolean {
    return this._callStatusBool(
      this._funcs.setActivationMetadata as (...args: unknown[]) => unknown,
      key,
      value
    );
  }

  activateLicense(): boolean {
    return this._callStatusBool(this._funcs.activateLicense as (...args: unknown[]) => unknown);
  }

  activateLicenseOffline(filePath: string): boolean {
    return this._callStatusBool(
      this._funcs.activateLicenseOffline as (...args: unknown[]) => unknown,
      filePath
    );
  }

  generateOfflineDeactivationRequest(filePath: string): boolean {
    return this._callStatusBool(
      this._funcs.generateOfflineDeactivationRequest as (...args: unknown[]) => unknown,
      filePath
    );
  }

  getLastActivationError(): number | null {
    return this._callU32Out(this._funcs.getLastActivationError as (out: Buffer) => unknown);
  }

  isLicenseGenuine(): boolean {
    return this._callStatusBool(this._funcs.isLicenseGenuine as (...args: unknown[]) => unknown);
  }

  isLicenseValid(): boolean {
    return this._callStatusBool(this._funcs.isLicenseValid as (...args: unknown[]) => unknown);
  }

  getServerSyncGracePeriodExpiryDate(): number | null {
    return this._callU32Out(this._funcs.getServerSyncGracePeriodExpiryDate as (out: Buffer) => unknown);
  }

  getActivationMode(bufferSize: number = 64): ActivationMode | null {
    const initial = allocBuffer(bufferSize, 64);
    const current = allocBuffer(bufferSize, 64);
    const result = (this._funcs.getActivationMode as (...args: unknown[]) => unknown)(
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

  getLibraryVersion(bufferSize: number = 32): string | null {
    return this._callStringOut(this._funcs.getLibraryVersion as (buffer: Buffer, size: number) => unknown, bufferSize);
  }

  reset(): boolean {
    return this._callStatusBool(this._funcs.reset as (...args: unknown[]) => unknown);
  }

  checkForUpdates(options: JsonMap = {}): JsonMap | null {
    const req = JSON.stringify(options || {});
    return this._withPipe<JsonMap>(() => {
      const resp = parseJson<DllResponse<JsonMap>>(
        (this._funcs.checkForUpdates as (...args: unknown[]) => unknown)(req) as string | null
      );
      return resp?.data ?? null;
    });
  }

  downloadUpdate(options: JsonMap = {}): JsonMap | null {
    const req = JSON.stringify(options || {});
    return this._withPipe<JsonMap>(() => {
      const resp = parseJson<DllResponse<JsonMap>>(
        (this._funcs.downloadUpdate as (...args: unknown[]) => unknown)(req) as string | null
      );
      return resp?.data ?? null;
    });
  }

  getUpdateState(): JsonMap | null {
    return this._withPipe<JsonMap>(() => {
      const resp = parseJson<DllResponse<JsonMap>>(
        (this._funcs.getUpdateState as (...args: unknown[]) => unknown)() as string | null
      );
      return resp?.data ?? null;
    });
  }

  waitForUpdateStateChange(lastSequence: number, timeoutMs: number = 30000): JsonMap | null {
    const sequence = Math.max(0, Math.floor(Number(lastSequence) || 0));
    const timeout = Math.max(0, Math.floor(Number(timeoutMs) || 0));
    return this._withPipe<JsonMap>(() => {
      const resp = parseJson<DllResponse<JsonMap>>(
        (this._funcs.waitForUpdateStateChange as (...args: unknown[]) => unknown)(
          sequence,
          timeout
        ) as string | null
      );
      return resp?.data ?? null;
    });
  }

  quitAndInstall(options: JsonMap = {}): boolean {
    const req = JSON.stringify(options || {});
    const result = this._withPipe<boolean>(
      () =>
        ((this._funcs.quitAndInstall as (...args: unknown[]) => unknown)(req) as number) === 1
    );
    return result === true;
  }

  jsonToCanonical(jsonStr: string): string | null {
    return ((this._funcs.jsonToCanonical as (...args: unknown[]) => unknown)(jsonStr) as string) || null;
  }

  static jsonToCanonical(jsonStr: string, options: Pick<DmApiOptions, 'dllPath'> = {}): string | null {
    const loaded = ensureLibLoaded(options.dllPath ?? null);
    return ((loaded.jsonToCanonical as (...args: unknown[]) => unknown)(jsonStr) as string) || null;
  }
}
