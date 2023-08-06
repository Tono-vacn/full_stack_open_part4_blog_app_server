const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')// the actual Express app
const bcrypt = require('bcrypt')


const api = supertest(app)
//superagent: test HTTP requests
//used internal port of superagent to make requests to the backend

const Blog = require('../models/blog')
const User = require('../models/user')
// const initialBlogs = [
//     {
//         title: 'VBBA',
//         author: 'VBBA',
//         url: 'VBBA',
//         likes: 8
//     },
//     {
//         title: 'VBBA2',
//         author: 'VBBA2',
//         url: 'VBBA2',
//         likes: 9

//     },
// ]


describe('when there is initially one user in db', () => {
    beforeEach(async() => {
        await User.deleteMany({})
        const user = new User({ username: 'root',name: 'superuser' ,password: 'sekret' })
        await user.save()
    })

    test('creation succeeds with a fresh username', async() => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'vbba',
            name: 'vbba',
            password: '123456',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper statuscode and message if username already taken', async() => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: '123456',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation fails with proper statuscode and message if password is less than 3 characters', async() => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'vbba2',
            name: 'vbba2',
            password: '12',
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('password must be at least 3 characters long')
        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

})

describe('when there is initially some blogs saved', () => {
    beforeEach(async() => {
        await Blog.deleteMany({})//delete all blogs from database
        // let blogObject = new Blog(helper.initialBlogs[0])
        // await blogObject.save()
        // blogObject = new Blog(helper.initialBlogs[1])
        // await blogObject.save()
        const blogObjects = helper.initialBlogs
            .map(blog => new Blog(blog))
        const promiseArray = blogObjects.map(blog => blog.save())
        await Promise.all(promiseArray)
        // helper.initialBlogs.forEach(async(blog) => {
        //     let blogObject = new Blog(blog)
        //     await blogObject.save()
        //     console.log('saved')
        // })
        // console.log('done')
    })

    test('blogs are returned as json', async() => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })

    test('all notes are returned', async() => {
        const response = await api.get('/api/blogs')
        // execution gets here only after the HTTP request is complete
        // the result of HTTP request is saved in variable response
        expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('a specific blog is within the returned notes', async() => {
        const response = await api.get('/api/blogs')
        const titles = response.body.map(r => r.title)
        expect(titles).toContain('VBBA')
    })
})


// test('id property exists', async() => {
//     const response = await api.get('/api/blogs')
//     expect(response.body[0].id).toBeDefined()
// })

describe('viewing a specific blog', () => {
    test('a specific blog can be viewed', async() => {
        const blogsatstart = await helper.blogsInDb()
        const blogtoview = blogsatstart[0]

        const resultBlog = await api
            .get(`/api/blogs/${blogtoview.id}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const processedBlogtoview = JSON.parse(JSON.stringify(blogtoview))
        //JSON序列化和解析:处理过程将把笔记对象的date属性值的类型从Date对象变成一个字符串。
        //正因为如此，我们不能直接比较resultNote.body和noteToView从数据库中读取的平等性。
        expect(resultBlog.body).toEqual(processedBlogtoview)
    })

    test('fails with statuscode 404 if blog does not exist', async() => {
        const validNonexistingId = await helper.nonExistingId()

        console.log(validNonexistingId)

        await api
            .get(`/api/blogs/${validNonexistingId}`)
            .expect(404)
    })

    test('fails with statuscode 400 if id is invalid', async() => {
        const invalidId = '5a3d5da59070081a82a3445'

        await api
            .get(`/api/blogs/${invalidId}`)
            .expect(400)
    })
})

describe('addition of a new blog', () => {
    beforeEach(async() => {
        await User.deleteMany({})
        const newUser = {
            username: 'test',
            name: 'test',
            password: 'test',
        }

        await api
            .post('/api/users')
            .send(newUser)
    })

    test('without token fails with statuscode 401', async() => {
        const newBlog = {
            title: 'VBBA3',
            author: 'VBBA3',
            url: 'VBBA3',
            likes: 10
        }
        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })

    test('a valid blog can be added ', async() => {
        const result = await api
            .post('/api/login')
            .send({
                username: 'test',
                password: 'test'
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(result.body.token).toBeDefined()

        const newBlog = {
            title: 'VBBA3',
            author: 'VBBA3',
            url: 'VBBA3',
            likes: 10
        }
        await api
            .post('/api/blogs')
            .set('Authorization', 'bearer ' + result.body.token)
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        // const response = await api.get('/api/blogs')
        // const titles = response.body.map(r => r.title)

        const blogsatend = await helper.blogsInDb()
        const titles = blogsatend.map(r => r.title)

        expect(blogsatend).toHaveLength(helper.initialBlogs.length + 1)
        expect(titles).toContain('VBBA3')
    })

    test('blog without title or url is not added', async() => {
        const result = await api
            .post('/api/login')
            .send({
                username: 'test',
                password: 'test'
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(result.body.token).toBeDefined()

        const newBlog = {
            author: 'VBBA4',
        }

        await api
            .post('/api/blogs')
            .set('Authorization', 'bearer ' + result.body.token)
            .send(newBlog)
            .expect(400)

        //const response = await api.get('/api/blogs')
        const blogsatend = await helper.blogsInDb()
        expect(blogsatend).toHaveLength(helper.initialBlogs.length + 1)
    })

    test('unique identifier property of the blog posts is named id', async() => {
        const response = await api.get('/api/blogs')
        expect(response.body[0].id).toBeDefined()
    })

    test('blog without likes property defaults to 0', async() => {
        const result = await api
            .post('/api/login')
            .send({
                username: 'test',
                password: 'test'
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(result.body.token).toBeDefined()

        const newBlog = {
            title: 'VBBA4',
            author: 'VBBA4',
            url: 'VBBA4'
        }

        await api
            .post('/api/blogs')
            .set('Authorization', 'bearer ' + result.body.token)
            .send(newBlog)

        const blogsatend = await helper.blogsInDb()
        const likes = blogsatend.map(r => r.likes)
        expect(likes).toContain(0)
    })

    test('a blog can be deleted', async() => {
        const result = await api
            .post('/api/login')
            .send({
                username: 'test',
                password: 'test'
            })
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(result.body.token).toBeDefined()

        const newBlog = {
            title: 'VBBA5',
            author: 'VBBA5',
            url: 'VBBA5'
        }

        await api
            .post('/api/blogs')
            .set('Authorization', 'bearer ' + result.body.token)
            .send(newBlog)
            .expect(201)

        const blogsatstart = await helper.blogsInDb()
        const blogtodelete = blogsatstart[blogsatstart.length - 1]

        await api
            .delete(`/api/blogs/${blogtodelete.id}`)
            .set('Authorization', 'bearer ' + result.body.token)
            .expect(204)

        const blogsatend = await helper.blogsInDb()
        expect(blogsatend).toHaveLength(helper.initialBlogs.length + 2)

        const titles = blogsatend.map(r => r.title)
        expect(titles).not.toContain(blogtodelete.title)
    })

    test('a blog can be updated', async() => {
        const blogsatstart = await helper.blogsInDb()
        const blogtoupdate = blogsatstart[0]

        const newBlog = {
            likes: 100,
        }

        await api
            .put(`/api/blogs/${blogtoupdate.id}`)
            .send(newBlog)
            .expect(200)

        const blogsatend = await helper.blogsInDb()
        const likes = blogsatend.map(r => r.likes)
        const titles = blogsatend.map(r => r.title)
        expect(titles).toContain(blogtoupdate.title)
        expect(likes).toContain(100)

    })

})



afterAll(async() => {
    await mongoose.connection.close()
})