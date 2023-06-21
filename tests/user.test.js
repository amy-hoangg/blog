const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);

const User = require('../models/user');
const bcrypt = require('bcrypt');

const initialUsers = [
  {
    username: 'user1',
    name: 'User One',
    password: 'password1',
  },
  {
    username: 'user2',
    name: 'User Two',
    password: 'password2',
  },
];

beforeEach(async () => {
  await User.deleteMany({});

  const saltRounds = 10;
  const userObjects = await Promise.all(
    initialUsers.map(async (user) => {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      return new User({ ...user, passwordHash });
    })
  );
  const promiseArray = userObjects.map((user) => user.save());
  await Promise.all(promiseArray);
});

describe('GET /api/users', () => {
  test('should retrieve all users', async () => {
    const response = await api.get('/api/users').expect(200).expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(initialUsers.length);
  });
});

describe('POST /api/users', () => {
  test('should create a new user with valid data', async () => {
    const newUser = {
      username: 'user3',
      name: 'User Three',
      password: 'password3',
    };

    await api.post('/api/users').send(newUser).expect(201);

    const response = await api.get('/api/users');
    const users = response.body;

    expect(users).toHaveLength(initialUsers.length + 1);

    const usernames = users.map((user) => user.username);
    expect(usernames).toContain(newUser.username);
  });

  test('should fail to create a new user with existing username', async () => {
    const usersAtStart = await User.find({});

    const newUser = {
      username: 'user1',
      name: 'User One Duplicate',
      password: 'password4',
    };

    const response = await api.post('/api/users').send(newUser).expect(400);

    expect(response.body).toHaveProperty('error', 'Username already exists');

    const usersAtEnd = await User.find({});
    expect(usersAtEnd).toEqual(usersAtStart);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
