import test from 'node:test';
import assert from 'node:assert/strict';
import { publicAssetUrl } from '../app/cadetWelcomeAsset.js';

const VIDEO = 'assets/cadet-general-chuikov.mp4';

test('cadet video URL respects relative Vite base for static builds', () => {
  assert.equal(publicAssetUrl('./', VIDEO), './assets/cadet-general-chuikov.mp4');
});

test('cadet video URL respects root and subpath deployments', () => {
  assert.equal(publicAssetUrl('/', VIDEO), '/assets/cadet-general-chuikov.mp4');
  assert.equal(publicAssetUrl('/tutor/', VIDEO), '/tutor/assets/cadet-general-chuikov.mp4');
});

test('leading slash in an asset path does not escape the configured base', () => {
  assert.equal(publicAssetUrl('/tutor', '/assets/cadet-general-chuikov.mp4'), '/tutor/assets/cadet-general-chuikov.mp4');
});
