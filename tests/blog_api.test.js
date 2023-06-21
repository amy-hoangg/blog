const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const api = supertest(app);

const Blog = require('../models/blog');

const initialBlogs = [
    {
      title: 'First Blog Post',
      author: 'John Doe',
      url: 'https://example.com/first-post',
      likes: 10
    },
    {
      title: 'Second Blog Post',
      author: 'Jane Smith',
      url: 'https://example.com/second-post',
      likes: 5
    },
  ];
  
beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
  
});

describe('testing the GET request', () => {
test('GET request to /api/blogs returns correct amount of blog posts in JSON format', async () => {
  const response = await api.get('/api/blogs').expect(200).expect('Content-Type', /application\/json/);

  expect(response.body).toHaveLength(initialBlogs.length);
});

test('the unique identifier property of blog posts is named id', async () => {
  const response = await api.get('/api/blogs');
  const blogs = response.body;

  blogs.forEach((blog) => {
    expect(blog.id).toBeDefined();
    expect(blog._id).toBeUndefined();
  });
});
})

describe('addition of a new blog', () => {
    test('making a POST request to /api/blogs successfully creates a new blog post', async () => {
        const newBlog = {
          title: 'New Blog Post',
          author: 'Alice Johnson',
          url: 'https://example.com/new-post',
          likes: 8,
        };
      
        // Get the initial blogs count
        const initialResponse = await api.get('/api/blogs');
        const initialBlogs = initialResponse.body;
        const initialBlogCount = initialBlogs.length;
      
        // Send POST request to create a new blog
        const response = await api
          .post('/api/blogs')
          .set('Authorization', `Bearer ${yourAuthToken}`)
          .send(newBlog)
          .expect(201)
          .expect('Content-Type', /application\/json/);
      
        // Get the updated blogs count
        const updatedResponse = await api.get('/api/blogs');
        const updatedBlogs = updatedResponse.body;
        const updatedBlogCount = updatedBlogs.length;
      
        // Check that the blog count has increased by 1
        expect(updatedBlogCount).toBe(initialBlogCount + 1);
      
        // Check that the new blog is included in the updated blogs
        const titles = updatedBlogs.map((blog) => blog.title);
        expect(titles).toContain(newBlog.title);
      });      
  
    test('if likes property is missing, it defaults to 0', async () => {
      const newBlog = {
        title: 'New Blog Post',
        author: 'Alice Johnson',
        url: 'https://example.com/new-post',
      };
  
      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiaWQiOiI2NDkxNzIwNGRjMTU2YWU3ODQyYjc5ODUiLCJpYXQiOjE2ODcyNzA0MzIsImV4cCI6MTY4NzI3NDAzMn0.r_t9Xxw6fxQLSGVS1rwZ3cdWJ12_37HGz2xoNuXSzjA`)
        .send(newBlog)
        .expect(201);
  
      const createdBlog = response.body;
  
      expect(createdBlog.likes).toBe(0);
    });
  
    test('creating a new blog without title should return status code 400', async () => {
      const newBlog = {
        author: 'John Doe',
        url: 'https://example.com',
        likes: 10,
      };
  
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiaWQiOiI2NDkxNzIwNGRjMTU2YWU3ODQyYjc5ODUiLCJpYXQiOjE2ODcyNzA0MzIsImV4cCI6MTY4NzI3NDAzMn0.r_t9Xxw6fxQLSGVS1rwZ3cdWJ12_37HGz2xoNuXSzjA`)
        .send(newBlog)
        .expect(400);
    });
  
    test('creating a new blog without url should return status code 400', async () => {
      const newBlog = {
        title: 'New Blog Post',
        author: 'John Doe',
        likes: 10,
      };
  
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG5fZG9lIiwiaWQiOiI2NDkxNzIwNGRjMTU2YWU3ODQyYjc5ODUiLCJpYXQiOjE2ODcyNzA0MzIsImV4cCI6MTY4NzI3NDAzMn0.r_t9Xxw6fxQLSGVS1rwZ3cdWJ12_37HGz2xoNuXSzjA`)
        .send(newBlog)
        .expect(400);
    });
  });
  
  
describe('updating a blog', () => {
    test('updating the likes of a blog post returns status code 200 and the updated blog post', async () => {
      const blogsAtStart = await Blog.find({});
      const blogToUpdate = blogsAtStart[0];
      const updatedLikes = blogToUpdate.likes + 1;
  
      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send({ likes: updatedLikes })
        .expect(200)
        .expect('Content-Type', /application\/json/);
  
      const updatedBlog = response.body;
  
      expect(updatedBlog.likes).toBe(updatedLikes);
  
      const blogsAtEnd = await Blog.find({});
      const likesAtEnd = blogsAtEnd.map((blog) => blog.likes);
      expect(likesAtEnd).toContain(updatedLikes);
    });
  
    test('updating a non-existent blog post returns status code 404', async () => {
      const nonExistentId = 'nonexistentid';
      const updatedLikes = 10;
  
      await api
        .put(`/api/blogs/${nonExistentId}`)
        .send({ likes: updatedLikes })
        .expect(400);
    });
  
    test('updating a blog post with an invalid ID returns status code 400', async () => {
      const invalidId = 'invalid_id';
      const updatedLikes = 10;
  
      await api
        .put(`/api/blogs/${invalidId}`)
        .send({ likes: updatedLikes })
        .expect(400);
    });
  });  
  
describe('deletion of a blog', () => {
  test('deleting a blog post returns status code 204', async () => {
    const blogsAtStart = await Blog.find({});
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await Blog.find({});
    expect(blogsAtEnd).toHaveLength(initialBlogs.length - 1);

    const ids = blogsAtEnd.map((blog) => blog.id);
    expect(ids).not.toContain(blogToDelete.id);
  });

  test('deleting a non-existent blog post returns status code 400', async () => {
    const nonExistentId = 'nonexistentid';
  
    await api.delete(`/api/blogs/${nonExistentId}`).expect(400);
  });
  

  test('deleting a blog post with an invalid ID returns status code 400', async () => {
    const invalidId = 'invalid_id';

    await api.delete(`/api/blogs/${invalidId}`).expect(400);
  });
})

afterAll(async () => {
  await mongoose.connection.close();
});
