export const DEFAULT_DLL_NAME = 'dm_api.dll';
export const DEFAULT_BUFFER_SIZE = 256;

export const ENV_DM_API_PATH = 'DM_API_PATH';
export const ENV_DM_APP_ID = 'DM_APP_ID';
export const ENV_DM_PUBLIC_KEY = 'DM_PUBLIC_KEY';
export const ENV_DM_LAUNCHER_ENDPOINT = 'DM_LAUNCHER_ENDPOINT';
export const ENV_DM_LAUNCHER_TOKEN = 'DM_LAUNCHER_TOKEN';

export const DM_ERR_OK = 0;
export const DM_ERR_FAIL = 1;
export const DM_ERR_INVALID_PARAMETER = 2;
export const DM_ERR_APPID_NOT_SET = 3;
export const DM_ERR_LICENSE_KEY_NOT_SET = 4;
export const DM_ERR_NOT_ACTIVATED = 5;
export const DM_ERR_LICENSE_EXPIRED = 6;
export const DM_ERR_NETWORK = 7;
export const DM_ERR_FILE_IO = 8;
export const DM_ERR_SIGNATURE = 9;
export const DM_ERR_BUFFER_TOO_SMALL = 10;

export const ACTIVATION_ERROR_NAMES: Record<number, string> = {
  [DM_ERR_OK]: 'DM_ERR_OK',
  [DM_ERR_FAIL]: 'DM_ERR_FAIL',
  [DM_ERR_INVALID_PARAMETER]: 'DM_ERR_INVALID_PARAMETER',
  [DM_ERR_APPID_NOT_SET]: 'DM_ERR_APPID_NOT_SET',
  [DM_ERR_LICENSE_KEY_NOT_SET]: 'DM_ERR_LICENSE_KEY_NOT_SET',
  [DM_ERR_NOT_ACTIVATED]: 'DM_ERR_NOT_ACTIVATED',
  [DM_ERR_LICENSE_EXPIRED]: 'DM_ERR_LICENSE_EXPIRED',
  [DM_ERR_NETWORK]: 'DM_ERR_NETWORK',
  [DM_ERR_FILE_IO]: 'DM_ERR_FILE_IO',
  [DM_ERR_SIGNATURE]: 'DM_ERR_SIGNATURE',
  [DM_ERR_BUFFER_TOO_SMALL]: 'DM_ERR_BUFFER_TOO_SMALL',
};

export const DEV_LICENSE_ERROR =
  'Development license is missing or corrupted. Run `distromate sdk renew` to regenerate the dev certificate.';
