const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const middlewares = require('../utils/middleware')

// const getTokenFrom = (request) => {
//     const authorization = request.get('authorization')
//     if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
//         return authorization.substring(7)
//     }
//     return null
// }

blogsRouter.get('/', async (request, response) => {
    // Blog.find({}).then(notes => {
    //     response.json(notes)
    // })
    const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
    response.json(blogs)
})

blogsRouter.get('/:id', async (request, response, next) => {
    // Blog.findById(request.params.id)
    //     .then(blog => {
    //         if (blog) {
    //             response.json(blog)
    //         } else {
    //             response.status(404).end()
    //         }
    //     })
    //     .catch(error => next(error))

    // express-async-errors: allows us to use async/await syntax when defining route handlers
    const blog = await Blog.findById(request.params.id)
    // try{
    if (blog) {
        response.json(blog)
    } else {
        response.status(404).end()
    }
    // }catch(exception){
    //     next(exception)
    // }

})

blogsRouter.post('/', middlewares.userExtractor, async (request, response, next) => {
    const body = request.body

    //const token = getTokenFrom(request)
    // const decodedToken = jwt.verify(request.token, process.env.SECRET)
    // if (!decodedToken.id) {
    //     return response.status(401).json({
    //         error: 'token missing or invalid'
    //     })
    // }
    // const user = await User.findById(decodedToken.id)

    const user = request.user

    //const user = await User.findById(body.userId)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes,
        user:user._id
    })

    // blog.save()
    //     .then(savedBlog => {
    //         response.status(201).json(savedBlog)
    //     })
    //     .catch(error => next(error))

    // try{
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
    // }catch(exception){
    //     next(exception)
    // }

})

blogsRouter.delete('/:id', middlewares.userExtractor, async (request, response, next) => {
    // const decodedToken = jwt.verify(request.token, process.env.SECRET)
    // if (!decodedToken.id) {
    //     return response.status(401).json({
    //         error: 'token missing or invalid'
    //     })
    // }

    // const user = await User.findById(decodedToken.id)
    const user = request.user

    const blog = await Blog.findById(request.params.id)

    if (blog.user.toString() === user.id.toString()) {
        await Blog.findByIdAndRemove(request.params.id)
        response.status(204).end()
    }else{
        return response.status(401).json({
            error: 'you are not authorized to delete this blog'
        })
    }
    // try{
    // await Blog.findByIdAndRemove(request.params.id)
    // response.status(204).end()
    // }catch(exception){
    //     next(exception)
    // }
//     Blog.findByIdAndRemove(request.params.id)
//         .then(() => {
//             response.status(204).end()
//         })
//         .catch(error => next(error))
})

blogsRouter.put('/:id', async (request, response, next) => {
    const body = request.body

    const blog = {
        likes: body.likes
    }

    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true }).populate('user', { username: 1, name: 1 })
    response.json(updatedBlog)
    console.log(updatedBlog)
// .then(updatedBlog => {
//     response.json(updatedBlog)
// })
// .catch(error => next(error))
})

blogsRouter.get('/:id/comments', async (request, response, next) => {
    const blog = await Blog.findById(request.params.id)
    response.json(blog.comments)
    console.log(blog.comments)
})

blogsRouter.post('/:id/comments', async (request, response, next) => {

    const blog = await Blog.findById(request.params.id)

    const body = request.body

    const comment = body.comment

    if (comment) {
        blog.comments = blog.comments.concat(comment)
    }


    const updatedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true }).populate('user', { username: 1, name: 1 })
    response.json(updatedBlog)
    console.log(updatedBlog)
})

module.exports = blogsRouter