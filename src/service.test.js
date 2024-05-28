const request = require('supertest');
const app = require('./service');
const version = require('./version.json');
const { authRouter } = require('./routes/authRouter.js');
const orderRouter = require('./routes/orderRouter.js');
const franchiseRouter = require('./routes/franchiseRouter.js');

test('get docs', async () => {
  const docsRes = await request(app).get('/api/docs');
  expect(docsRes.status).toBe(200);
  expect(docsRes.body.version).toBe(version.version);
  expect(docsRes.body.endpoints).toEqual([...authRouter.endpoints, ...orderRouter.endpoints, ...franchiseRouter.endpoints]);
});

test('base route', async () => {
  const res = await request(app).get('/');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ message: 'welcome to JWT Pizza', version: version.version });
});

// test('unknown endpoint', async () => {
//   const res = await request(app).get('/unknown');
//   expect(res.status).toBe(404);
//   expect(res.body).toEqual({ message: 'unknown endpoint' });
// });
