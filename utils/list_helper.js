const _ = require('lodash')
const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item.likes
    }
    return blogs.length === 0
        ? 0
        : blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const reducer = (max, item) => {
        return max.likes > item.likes
            ? max
            : item
    }
    return blogs.length === 0
        ? {}
        : blogs.reduce(reducer, 0)
}

const mostBlogs = (blogs) => {
    const reducer = (result, item) => {
        const author = item.author
        result[author] = result[author]
            ? result[author] + 1
            : 1
        return result
    }
    const result = _.reduce(blogs, reducer, {})
    const max = _.max(_.values(result))
    const author = _.findKey(result, (o) => {
        return o === max
    })
    return {
        author,
        blogs: max
    }

}

const mostLikes = (blogs) => {
    const reducer = (result, item) => {
        const author = item.author
        result[author] = result[author]
            ? result[author] + item.likes
            : item.likes
        return result
    }
    const result = _.reduce(blogs, reducer, {})
    const max = _.max(_.values(result))
    const author = _.findKey(result, (o) => {
        return o === max
    })
    return {
        author,
        likes: max
    }

}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes

}