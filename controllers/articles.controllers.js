const {
  fetchArticles,
  fetchArticlebyId,
  updateArticleVoteCount,
} = require("../models/articles.models.js");

const { checkExists } = require("../models/utils.models.js");

const getArticleById = (req, res, next) => {
  const { article_id } = req.params;

  fetchArticlebyId(article_id)
    .then((data) => {
      const article = data.rows[0];
      res.status(200).send({ article });
    })
    .catch((err) => next(err));
};

const getArticles = (req, res, next) => {
  const { sort_by = "created_at", order = "desc", topic } = req.query;

  const articlesPromises = [fetchArticles(sort_by, order, topic)];

  if (topic) articlesPromises.push(checkExists("topics", "slug", topic));

  Promise.all(articlesPromises)
    .then((promisesResult) => {
      const articles = promisesResult[0].rows;
      res.status(200).send({ articles });
    })
    .catch((err) => next(err));
};

const patchVoteCount = (req, res, next) => {
  const { article_id } = req.params;
  const incrementVote = req.body;
  updateArticleVoteCount(article_id, incrementVote)
    .then((data) => {
      const updatedArticle = data.rows[0];
      res.status(200).send({ updatedArticle });
    })
    .catch((err) => {
      next(err);
    });
};

module.exports = { getArticles, getArticleById, patchVoteCount };
