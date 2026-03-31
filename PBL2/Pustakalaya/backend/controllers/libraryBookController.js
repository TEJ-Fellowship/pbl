const libraryBookService = require("../services/libraryBookService");

async function list(req, res) {
  const result = await libraryBookService.listBooks(req.user._id, req.query);
  return res.json(result);
}

async function create(req, res) {
  const result = await libraryBookService.createBook(req.user._id, req.body);
  return res.status(201).json(result);
}

module.exports = { list, create };
