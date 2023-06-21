const blogsRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { userExtractor } = require('../utils/middleware');

blogsRouter.use(userExtractor);

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

blogsRouter.post('/', async (request, response, next) => {
  const user = request.user;
  const token = request.token;
  const { title, author, url, likes } = request.body;

  if (!title || !url) {
    return response.status(400).json({ error: 'Title or URL is missing' });
  }
  if (!token) {
    return response.status(401).json({ error: 'Token missing' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' });
    }
    if (!user) {
      console.log('User not found:', user); // Add this console.log statement
      return response.status(404).json({ error: 'User not found' });
    }
    
    const blog = new Blog({
      title,
      author,
      url,
      likes,
      user: user._id,
    });

    const savedBlog = await blog.save();
    console.log('Before concatenation:', user.blogs);
    console.log('User Object:', user);
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();
    console.log('After concatenation:', user.blogs); 
  }
 
  catch (error) {
    console.error(error); // Print the error to the console for debugging purposes
    next(error);
  }
});

blogsRouter.put('/:id', async (request, response, next) => {
  const { id } = request.params;
  const { likes } = request.body;

  try {
    const updatedBlog = await Blog.findByIdAndUpdate(id, { likes }, { new: true });
    if (updatedBlog) {
      response.json(updatedBlog);
    } else {
      response.status(404).json({ error: 'Blog not found' });
    }
  } catch (error) {
    next(error);
  }
});

blogsRouter.delete('/:id', async (request, response, next) => {
  try {
    const id = request.params.id;
    const token = request.token; 

    if (!token) {
      return response.status(401).json({ error: 'Token missing' });
    }
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if (!decodedToken.id) {
      return response.status(401).json({ error: 'Token invalid' });
    }

    const blog = await Blog.findById(id);
    if (!blog) {
      return response.status(404).json({ error: 'Blog not found' });
    }
    const userId = decodedToken.id;
    if (blog.user.toString() !== userId.toString()) {
      return response.status(401).json({ error: 'User not authorized to delete the blog' });
    }

    await Blog.findByIdAndRemove(id);
    response.status(204).end();
  } 
  
  catch (error) {
    next(error);
  }
});

module.exports = blogsRouter;
