const request = require('supertest');
const app = require('../service');

test('gets a user', async () => {
	const registrationResponse = await request(app).post('/api/auth').send({
		name: 'user test diner',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'a',
	});

	expect(registrationResponse.status).toBe(200);

	const response = await request(app)
		.get('/api/user/me')
		.set('Authorization', `Bearer ${registrationResponse.body.token}`);

	expect(response.status).toBe(200);
	expect(response.body).toEqual({
		id: registrationResponse.body.user.id,
		name: registrationResponse.body.user.name,
		email: registrationResponse.body.user.email,
		roles: [{ role: 'diner' }],
		iat: expect.any(Number),
	});
});

test('updates a user', async () => {
	const registrationResponse = await request(app).post('/api/auth').send({
		name: 'user update test',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'a',
	});

	expect(registrationResponse.status).toBe(200);

	const updatedUser = {
		name: 'updated user',
		email: `${Math.random().toString(36).substring(2, 12)}@test.com`,
		password: 'updated-password',
	};
	const updateResponse = await request(app)
		.put(`/api/user/${registrationResponse.body.user.id}`)
		.set('Authorization', `Bearer ${registrationResponse.body.token}`)
		.send(updatedUser);

	expect(updateResponse.status).toBe(200);
	expect(updateResponse.body).toEqual({
		user: {
			id: registrationResponse.body.user.id,
			name: updatedUser.name,
			email: updatedUser.email,
			roles: [{ role: 'diner' }],
		},
		token: expect.any(String),
	});

	const getResponse = await request(app)
		.get('/api/user/me')
		.set('Authorization', `Bearer ${updateResponse.body.token}`);

	expect(getResponse.status).toBe(200);
	expect(getResponse.body).toEqual(
		expect.objectContaining({
			id: registrationResponse.body.user.id,
			name: updatedUser.name,
			email: updatedUser.email,
			roles: [{ role: 'diner' }],
		})
	);
});