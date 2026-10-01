const request = require('supertest');
const app = require('../service');
const { DB, Role } = require('../database/database');
const { setAuth } = require('./authRouter');

let adminToken;

beforeAll(async () => {
	const adminUser = await DB.addUser({
		name: 'menu test admin',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'a',
		roles: [{ role: Role.Admin }],
	});
	adminToken = await setAuth(adminUser);
});

test('gets menu', async () => {
	const response = await request(app).get('/api/order/menu');

	expect(response.status).toBe(200);
	expect(response.body).toEqual(expect.any(Array));

	for (const menuItem of response.body) {
		expect(menuItem).toEqual(
			expect.objectContaining({
				id: expect.any(Number),
				title: expect.any(String),
				image: expect.any(String),
				price: expect.any(Number),
				description: expect.any(String),
			})
		);
	}
});

test('adds menu items', async () => {
	const menuItem = {
		title: `test pizza ${Math.random().toString(36).substring(2, 12)}`,
		description: 'A test pizza',
		image: 'test-pizza.png',
		price: 0.01,
	};

	const response = await request(app)
		.put('/api/order/menu')
		.set('Authorization', `Bearer ${adminToken}`)
		.send(menuItem);

	expect(response.status).toBe(200);
	expect(response.body).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				...menuItem,
				id: expect.any(Number),
			}),
		])
	);
});

test('gets orders', async () => {
    const response = await request(app)
        .get('/api/order')
        .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
        expect.objectContaining({
            dinerId: expect.any(Number),
            orders: expect.any(Array),
            page: expect.any(Number),
        })
    );
});