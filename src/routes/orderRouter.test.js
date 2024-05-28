const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'][0];
});

test('get menu', async () => {
  const res = await request(app).get('/api/order/menu');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('add menu item without correct role', async () => {
  const res = await request(app).put('/api/order/menu').set('Cookie', testUserCookie).send({ title: 'test', description: 'test', image: 'test', price: 'test' });
  expect(res.status).toBe(403);
});

test('getOrders', async () => {
  const res = await request(app).get('/api/order').set('Cookie', testUserCookie);
  expect(res.status).toBe(200);
  expect(res.body.orders).toEqual([]);
});

test('add order', async () => {
  global.fetch = jest.fn((url) => ({ json: () => ({ status: 200 }) }));

  const res = await request(app)
    .post('/api/order')
    .set('Cookie', testUserCookie)
    .send({ franchiseId: 1, storeId: 1, items: [{ menuId: 1, description: 'test', price: 0.05 }] });
  expect(res.status).toBe(500);
});
