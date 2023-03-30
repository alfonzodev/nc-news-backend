const db = require("../db/connection.js");

const fetchTopics = () => {
  return db.query("SELECT * FROM topics");
};

const fetchArticlebyId = (article_id) => {
  return db
    .query(
      `SELECT articles.author, articles.body, title, articles.article_id, topic, articles.created_at, articles.votes, article_img_url, COUNT(comments.comment_id) AS comment_count 
        FROM articles 
        LEFT JOIN comments ON articles.article_id = comments.article_id 
        WHERE articles.article_id = $1 GROUP BY articles.article_id `,
      [article_id]
    )
    .then((data) => {
      if (data.rowCount === 0) {
        return Promise.reject({
          status: 404,
          msg: "Not found: article_id does not exist!",
        });
      } else {
        return data;
      }
    });
};

const fetchArticles = (sort_by, order, topic) => {
  const validSortQueries = [
    "author",
    "title",
    "article_id",
    "topic",
    "created_at",
    "votes",
    "comment_count",
  ];
  let queryStr = `
    SELECT articles.author, title, articles.article_id, topic, articles.created_at, articles.votes, article_img_url, COUNT(comments.comment_id) AS comment_count 
    FROM articles 
    LEFT JOIN comments ON articles.article_id = comments.article_id 
  `;

  const queryParams = [];

  // Including topic in sql query
  if (topic) {
    queryStr += ` WHERE topic = $1`;
    queryParams.push(topic);
  }

  queryStr += " GROUP BY articles.article_id";

  // Validating and including sort_by
  if (validSortQueries.includes(sort_by)) {
    queryStr += ` ORDER BY ${sort_by}`;
  } else {
    return Promise.reject({
      status: 400,
      msg: `Error: Invalid query - ${sort_by}.`,
    });
  }

  // validating and including order
  if (order === "asc" || order === "desc") {
    queryStr += ` ${order.toUpperCase()}`;
  } else {
    return Promise.reject({
      status: 400,
      msg: `Error: Invalid query - ${order}.`,
    });
  }

  return db.query(queryStr, queryParams);
};

const fetchCommentsByArticle = (article_id) => {
  return db.query(
    "SELECT * FROM comments WHERE article_id = $1 ORDER BY created_at DESC",
    [article_id]
  );
};

const insertComment = (article_id, comment) => {
  if (!comment.hasOwnProperty("username") || !comment.hasOwnProperty("body")) {
    return Promise.reject({ status: 400, msg: "Error: missing information." });
  } else if (comment.body === "") {
    return Promise.reject({ status: 400, msg: "Error: empty comment." });
  }
  return db.query(
    "INSERT INTO comments(body, article_id, author) VALUES ($1, $2, $3) RETURNING *",
    [comment.body, article_id, comment.username]
  );
};

const updateArticleVoteCount = (article_id, incrementVote) => {
  if (!incrementVote.hasOwnProperty("inc_votes")) {
    return Promise.reject({ status: 400, msg: "Error: missing information." });
  }

  return db
    .query(
      "UPDATE articles SET votes = votes + $1 WHERE article_id = $2 RETURNING *",
      [incrementVote.inc_votes, article_id]
    )
    .then((data) => {
      if (data.rowCount === 0) {
        return Promise.reject({
          status: 404,
          msg: "Not found: article_id does not exist!",
        });
      } else {
        return data;
      }
    });
};

const deleteCommentById = (comment_id) => {
  return db
    .query("DELETE FROM comments WHERE comment_id = $1", [comment_id])
    .then((data) => {
      if (data.rowCount === 0) {
        return Promise.reject({
          status: 404,
          msg: "Not Found: comment_id does not exist.",
        });
      }
      return data;
    });
};

module.exports = {
  fetchTopics,
  fetchArticlebyId,
  fetchArticles,
  fetchCommentsByArticle,
  insertComment,
  updateArticleVoteCount,
  deleteCommentById,
};
