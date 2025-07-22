// Filtering

const filterArticles = (articles, selectedCategory="", searchKeyword="") => {
  let result = [...articles];

  if (selectedCategory) {
    result = result.filter(
      (article) =>
        typeof article.category === "string" &&
        article.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  if (searchKeyword) {
    const lowerKeyword = searchKeyword.toLowerCase();
    result = result.filter(
      (article) =>
        article.title?.toLowerCase().includes(lowerKeyword) ||
        article.description?.toLowerCase().includes(lowerKeyword)
    );
  }
  return result;
}

export default filterArticles;
  