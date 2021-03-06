const express = require('express')
const { v4: uuid } = require('uuid')
const { isWebUri } = require('valid-url')
const logger = require('../logger')
const { bookmarks } = require('../store')
const BookmarksService = require('./bookmarks-service')
const bookmarksRouter = express.Router()
const bodyParser = express.json()

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
        .then(bookmarks => {
            res.json(bookmarks)
        })
        .catch(next)
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description=false, rating } = req.body

    if (!title) {
        logger.error('Title is required');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!url) {
        logger.error('URL is required');
        return res
            .status(400)
            .send('Invalid data');
    }

    if (!rating) {
        logger.error('Rating is required');
        return res
            .status(400)
            .send('Invalid data');
    }

    // for (const field of ['title', 'url', 'rating']) {
    //     if (!req.body[field]) {
    //       logger.error(`${field} is required`)
    //       return res.status(400).send(`'${field}' is required`)
    //     }
    //   }

    if(!Number.isInteger(rating) || rating < 0 || rating > 5) {
        logger.error(`Invalid rating '${rating}' supplied`)
        return res
            .status(400)
            .send(`'rating' must be a number between 0 and 5` )
    }

    if (!isWebUri(url)) {
        logger.error(`Invalid url '${url}' supplied`)
        return res
            .status(400)
            .send(`'url' must be a valid URL`)
    }

    const id = uuid();
    const bookmark = {
        id,
        title,
        url,
        description,
        rating
    }

    bookmarks.push(bookmark)

    logger.info(`Bookmark with id ${id} created`);

    res
        .status(201)
        .location(`http://localhost:8000/${id}`)
        .json(bookmark);


  })

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        const { id } = req.params
        BookmarksService.getById(knexInstance, id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: `Bookmark does not exist` }
                    })
                }
                res.json(bookmark)
            })
            .catch(next)
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
            .status(404)
            .send('Bookmark not found');
    };

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted`);

    res
        .status(204)
        .end();
  })

module.exports = bookmarksRouter