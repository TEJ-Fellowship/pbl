const shelfService = require("../services/shelfService");

async function create(req, res) {
  const result = await shelfService.createShelf(req.user._id, req.body?.name);
  return res.status(201).json(result);
}

async function list(req, res) {
  const result = await shelfService.listShelves(req.user._id);
  return res.json(result);
}

async function getOne(req, res) {
  const result = await shelfService.getShelf(req.user._id, req.params.shelfId);
  return res.json(result);
}

async function update(req, res) {
  const result = await shelfService.updateShelf(
    req.user._id,
    req.params.shelfId,
    req.body?.name,
  );
  return res.json(result);
}

async function remove(req, res) {
  const result = await shelfService.removeShelf(
    req.user._id,
    req.params.shelfId,
  );
  return res.json(result);
}

async function addBook(req, res) {
  const result = await shelfService.addBookToShelf(
    req.user._id,
    req.params.shelfId,
    req.body?.bookId,
  );
  return res.json(result);
}

async function removeBook(req, res) {
  const result = await shelfService.removeBookFromShelf(
    req.user._id,
    req.params.shelfId,
    req.params.bookId,
  );
  return res.json(result);
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  addBook,
  removeBook,
};
