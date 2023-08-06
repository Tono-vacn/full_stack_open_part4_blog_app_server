const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
    {
        title: 'VBBA',
        author: 'VBBA',
        url: 'VBBA',
        likes: 8
    },
    {
        title: 'VBBA2',
        author: 'VBBA2',
        url: 'VBBA2',
        likes: 9

    },
]
const nonExistingId = async () => {
    const blog = new Blog({ title: 'willremovethissoon', author: 'willremovethissoon', url: 'willremovethissoon', likes: 0 })
    await blog.save()
    await blog.deleteOne()

    return blog._id.toString()
}

const blogsInDb = async () => {
    const blogs = await Blog.find({})
    return blogs.map(b => b.toJSON())
}

const usersInDb = async () => {
    const users = await User.find({})
    return users.map(u => u.toJSON())
}

module.exports = {
    initialBlogs, nonExistingId, blogsInDb, usersInDb
}