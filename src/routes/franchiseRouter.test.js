const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database');
const { setAuth } = require('./authRouter');

let testUser;
let adminToken;

beforeAll(async () => {
	const response = await request(app).post('/api/auth').send({
		name: 'franchise test user',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'a',
	});

	expect(response.status).toBe(200);
	testUser = response.body;

	const adminUser = await DB.addUser({
		name: 'franchise test admin',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'a',
		roles: [{ role: Role.Admin }],
	});
	adminToken = await setAuth(adminUser);
});

test('gets franchises', async () => {
	const response = await request(app).get('/api/franchise');

	expect(response.status).toBe(200);
	expect(response.body).toEqual(
		expect.objectContaining({
			franchises: expect.any(Array),
			more: expect.any(Boolean),
		})
	);

	for (const franchise of response.body.franchises) {
		expect(franchise).toEqual(
			expect.objectContaining({
				id: expect.any(Number),
				name: expect.any(String),
				stores: expect.any(Array),
			})
		);
	}
});

test('gets franchises for the authenticated user', async () => {
	const response = await request(app)
		.get(`/api/franchise/${testUser.user.id}`)
		.set('Authorization', `Bearer ${testUser.token}`);

	expect(response.status).toBe(200);
	expect(response.body).toEqual([]);
});

test('creates a franchise', async () => {
	const franchiseName = `test franchise ${Math.random().toString(36).substring(2, 12)}`;
	const response = await request(app)
		.post('/api/franchise')
		.set('Authorization', `Bearer ${adminToken}`)
		.send({
			name: franchiseName,
			admins: [{ email: testUser.user.email }],
		});

	expect(response.status).toBe(200);
	expect(response.body).toEqual(
		expect.objectContaining({
			id: expect.any(Number),
			name: franchiseName,
			admins: [
				expect.objectContaining({
					id: testUser.user.id,
					name: testUser.user.name,
					email: testUser.user.email,
				}),
			],
		})
	);
});

test('deletes a franchise', async () => {
	const franchiseName = `franchise to delete ${Math.random().toString(36).substring(2, 12)}`;
	const createResponse = await request(app)
		.post('/api/franchise')
		.set('Authorization', `Bearer ${adminToken}`)
		.send({
			name: franchiseName,
			admins: [{ email: testUser.user.email }],
		});

	expect(createResponse.status).toBe(200);

	const deleteResponse = await request(app)
		.delete(`/api/franchise/${createResponse.body.id}`)
		.set('Authorization', `Bearer ${adminToken}`);

	expect(deleteResponse.status).toBe(200);
	expect(deleteResponse.body).toEqual({ message: 'franchise deleted' });

	const lookupResponse = await request(app)
		.get('/api/franchise')
		.query({ name: franchiseName });

	expect(lookupResponse.status).toBe(200);
	expect(lookupResponse.body.franchises).toEqual([]);
});

test('creates a store', async () => {
    const franchiseName = `test franchise ${Math.random().toString(36).substring(2, 12)}`;
	const franchiseResponse = await request(app)
		.post('/api/franchise')
		.set('Authorization', `Bearer ${adminToken}`)
		.send({
			name: franchiseName,
			admins: [{ email: testUser.user.email }],
		});
    const franchiseId = franchiseResponse.body.id;

    const storeName = `test store ${Math.random().toString(36).substring(2, 12)}`;
    const response = await request(app)
		.post(`/api/franchise/${franchiseId}/store`)
		.set('Authorization', `Bearer ${adminToken}`)
		.send({ name: storeName });

    expect(response.status).toBe(200);
	expect(response.body).toEqual(
		expect.objectContaining({
			id: expect.any(Number),
			franchiseId,
			name: storeName,
		})
	);
});

test('deletes a store', async () => {
    const franchiseName = `test franchise ${Math.random().toString(36).substring(2, 12)}`;
	const franchiseResponse = await request(app)
		.post('/api/franchise')
		.set('Authorization', `Bearer ${adminToken}`)
		.send({
			name: franchiseName,
			admins: [{ email: testUser.user.email }],
		});
    const franchiseId = franchiseResponse.body.id;

    const storeName = `store to delete ${Math.random().toString(36).substring(2, 12)}`;
    const createResponse = await request(app)
		.post(`/api/franchise/${franchiseId}/store`)
		.set('Authorization', `Bearer ${adminToken}`)
		.send({ name: storeName });

    const deleteResponse = await request(app)
		.delete(`/api/franchise/${franchiseId}/store/${createResponse.body.id}`)
		.set('Authorization', `Bearer ${adminToken}`);
	expect(deleteResponse.status).toBe(200);
	expect(deleteResponse.body).toEqual({ message: 'store deleted' });

	const lookupResponse = await request(app)
		.get('/api/franchise')
		.query({ name: franchiseName });

	expect(lookupResponse.status).toBe(200);
	expect(lookupResponse.body.franchises).toHaveLength(1);
	expect(lookupResponse.body.franchises[0].stores).not.toEqual(
		expect.arrayContaining([
			expect.objectContaining({ id: createResponse.body.id }),
		])
	);
});