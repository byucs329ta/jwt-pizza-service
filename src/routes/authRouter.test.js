const request = require('supertest');
const app = require('../service');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };
let testUserCookie;

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'];
});

test('login', async () => {
  const loginRes = await request(app).put('/api/auth').send(testUser);

  expect(loginRes.status).toBe(200);

  const cookies = loginRes.headers['set-cookie'];
  expect(cookies[0]).toMatch(/token=.+; Path=\/; HttpOnly; Secure; SameSite=None/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(loginRes.body).toMatchObject(user);
});

test('register success', async () => {
  const registerRes = await request(app).post('/api/auth').send(testUser);
  expect(registerRes.status).toBe(200);
  const cookies = registerRes.headers['set-cookie'];
  expect(cookies[0]).toMatch(/token=.+; Path=\/; HttpOnly; Secure; SameSite=None/);

  const { password, ...user } = { ...testUser, roles: [{ role: 'diner' }] };
  expect(registerRes.body).toMatchObject(user);
});

test('register fail', async () => {
  const registerRes = await request(app)
    .post('/api/auth')
    .send({ ...testUser, email: '' });
  expect(registerRes.status).toBe(400);
  expect(registerRes.body).toEqual({ message: 'name, email, and password are required' });
});

test('logout', async () => {
  const logoutRes = await request(app).delete('/api/auth');
  expect(logoutRes.status).toBe(200);
  const cookies = logoutRes.headers['set-cookie'];
  expect(cookies[0]).not.toMatch(/token=.+; Path=\/; HttpOnly; Secure; SameSite=None/);
  expect(logoutRes.body).toEqual({ message: 'logout successful' });
});

test('unauthenticated request blocked on routes using authenticateToken', async () => {
  const res = await request(app).get('/api/franchise/1');
  expect(res.status).toBe(401);
});
