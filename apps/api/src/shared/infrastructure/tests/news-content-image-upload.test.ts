import { test } from 'node:test';
import assert from 'node:assert';
import { Hono } from 'hono';
import { uploadContentImageHandler } from '../../../modules/news/http/news-admin.controller.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type TestApp = Hono<{ Variables: { user: { id: string } } }>;

function buildApp(): TestApp {
  const app: TestApp = new Hono();
  app.use('*', async (c, next) => {
    c.set('user', { id: 'test-writer' });
    await next();
  });
  app.post('/images', uploadContentImageHandler);
  return app;
}

function post(app: TestApp, form: FormData) {
  return app.request('/images', { method: 'POST', body: form });
}

test('POST /images validation (rejects before any Cloudinary call)', async (t) => {
  const app = buildApp();

  await t.test('400 FILE_REQUIRED when no image field is sent', async () => {
    const res = await post(app, new FormData());
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'FILE_REQUIRED');
  });

  await t.test('400 INVALID_MIME_TYPE for non-image content types', async () => {
    const form = new FormData();
    form.append('image', new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));
    const res = await post(app, form);
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'INVALID_MIME_TYPE');
  });

  await t.test('400 FILE_TOO_LARGE above 5MB', async () => {
    const form = new FormData();
    form.append(
      'image',
      new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'big.png', { type: 'image/png' })
    );
    const res = await post(app, form);
    assert.strictEqual(res.status, 400);
    assert.strictEqual((await res.json()).code, 'FILE_TOO_LARGE');
  });
});
