const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database.js');

const testUser = { name: 'pizza diner', email: 'reg@test.com', password: 'a' };

function randomName() {
  return Math.random().toString(36).substring(2, 12);
}

async function createAdminUser() {
  let user = { password: 'a', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  const addRes = await DB.addUser(user);
  user = { ...user, id: addRes.id, password: 'a' };

  const registerRes = await request(app).put('/api/auth').send(user);
  const userCookie = registerRes.headers['set-cookie'];

  return [user, userCookie];
}

beforeAll(async () => {
  testUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const registerRes = await request(app).post('/api/auth').send(testUser);
  testUserCookie = registerRes.headers['set-cookie'];
});

test('list franchises', async () => {
  const res = await request(app).get('/api/franchise');
  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test('list user franchises', async () => {
  const [_, adminUserCookie] = await createAdminUser();
  const listRes = await request(app).get('/api/franchise/1').set('Cookie', adminUserCookie);
  expect(listRes.status).toBe(200);
  expect(listRes.body).toEqual([]);
});

test('create franchise without correct role', async () => {
  const res = await request(app)
    .post('/api/franchise')
    .set('Cookie', testUserCookie)
    .send({ name: 'test', admins: [{ email: 'test' }] });
  expect(res.status).toBe(403);
});

test('create franchise with correct role', async () => {
  const [adminUser, adminUserCookie] = await createAdminUser();
  const res = await request(app)
    .post('/api/franchise')
    .set('Cookie', adminUserCookie)
    .send({ name: 'test', admins: [{ email: adminUser.email }] });
  expect(res.status).toBe(200);
  expect(res.body.name).toBe('test');
  await DB.deleteFranchise(res.body.id);
});

test('delete franchise without correct role', async () => {
  const res = await request(app).delete('/api/franchise/1').set('Cookie', testUserCookie);
  expect(res.status).toBe(403);
});

test('create store without correct role', async () => {
  const res = await request(app).post('/api/franchise/1/store').set('Cookie', testUserCookie).send({ franchiseId: 1, name: 'test' });
  expect(res.status).toBe(403);
});

test('delete store without correct role', async () => {
  const res = await request(app).delete('/api/franchise/1/store/1').set('Cookie', testUserCookie);
  expect(res.status).toBe(403);
});
