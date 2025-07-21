import { useEffect, useState } from "react";
import axios from "axios";
import Modal from "./Modal";
import ArticleCard from "./ArticleCard";
import Navbar from "./NavBar";

// Robust categorization for your JSON sample and common news patterns:
const categorizeArticle = (article) => {
  const t = (article.title || "").toLowerCase();
  const d = (article.description || "").toLowerCase();
  const s = (article.source?.name || "").toLowerCase();

  // SPORTS
  if (
    t.match(
      /ufc|boxing|fight|football|soccer|cricket|match|tournament|nba|mlb|nfl|hockey|olympic|game|draw|champ|winner|results|sports?/
    ) ||
    d.match(
      /ufc|boxing|fight|football|soccer|cricket|match|tournament|nba|mlb|nfl|hockey|olympic|game|draw|champ|winner|results|sports?/
    ) ||
    s.match(/sport|ufc|mma|nba|cbs sports|al jazeera|espn/)
  )
    return { ...article, category: "Sports" };

  // BUSINESS
  if (
    t.match(
      /business|market|stock|trade|invest|finance|economy|financial|fund|earnings|exports|merger|deal|budget/
    ) ||
    d.match(
      /business|market|stock|trade|finance|merger|deal|economy|billion|export|budget|corporation|corporate|community|radio|public/
    ) ||
    s.match(
      /business|bloomberg|forbes|market|reuters|cnbc|the wall street journal|wsj|financial|npr/
    )
  )
    return { ...article, category: "Business" };

  // TECHNOLOGY
  if (
    t.match(
      /tech|ai|robot|software|app|cyber|gadget|device|smart|digital|cloud|comput|startup|wired|the verge|astronomer/
    ) ||
    d.match(
      /tech|ai|robot|software|app|cyber|device|digital|cloud|comput|astronomer|company|startup|ceo/
    ) ||
    s.match(/technology|wired|the verge|techcrunch|gizmodo|dw \(english\)/)
  )
    return { ...article, category: "Technology" };

  // HEALTH
  if (
    t.match(
      /health|medical|virus|pandemic|covid|body|infect|vaccine|disease|wellness|doctor|hospital|fungi|brain/
    ) ||
    d.match(
      /health|medical|virus|covid|body|infect|hospital|doctor|vaccine|disease|wellness|fungi|mental|children/
    ) ||
    s.match(/health|wellness|medical|bbc news/)
  )
    return { ...article, category: "Health" };

  // ENTERTAINMENT
  if (
    t.match(
      /entertain|movie|music|film|show|concert|actor|celebrity|series|hollywood|bollywood|album|tv|drama|horoscope/
    ) ||
    d.match(
      /entertain|movie|tv|film|music|show|concert|celebrity|series|album|drama|horoscope/
    ) ||
    s.match(/entertainment|hollywood|bollywood|mtv|sun-times/)
  )
    return { ...article, category: "Entertainment" };

  // SCIENCE
  if (
    t.match(
      /science|nasa|space|study|research|astronomy|physics|discovery|scientist|laboratory|cell|genetic|chemistry|biology|fungi|earthquake|quake|tsunami|warning|influencing/
    ) ||
    d.match(
      /science|nasa|space|study|research|astronomy|discovery|fungi|brain|gene|cell|virus|biology|quake|tsunami|earthquake|kamchatka|bay|air pocket|originat/
    ) ||
    s.match(
      /science|nasa|scientific american|nature|associated press|ap news|bbc news/
    )
  )
    return { ...article, category: "Science" };

  // General fallback
  return { ...article, category: "General" };
};

const NewsFeed = ({
  selectedCategory = "",
  onCategorySelect,
  searchKeyword = "",
  onSearch,
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get("/api/news");
        const categorized = response.data.articles.map(categorizeArticle);
        setArticles(categorized);

        // Optional: Debug
        // const catCount = categorized.reduce((acc, a) => {
        //   acc[a.category] = (acc[a.category] || 0) + 1;
        //   return acc;
        // }, {});
        // console.log("Category counts:", catCount);
      } catch (error) {
        console.error("Error fetching news:", error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Filtering
  let filteredArticles = articles;
  if (selectedCategory) {
    filteredArticles = filteredArticles.filter(
      (article) =>
        typeof article.category === "string" &&
        article.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }
  if (searchKeyword) {
    const lowerKeyword = searchKeyword.toLowerCase();
    filteredArticles = filteredArticles.filter(
      (article) =>
        article.title?.toLowerCase().includes(lowerKeyword) ||
        article.description?.toLowerCase().includes(lowerKeyword)
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <div className="animate-spin text-4xl">📰</div>
        <p className="mt-4 text-gray-600 text-lg">
          Fetching fresh headlines...
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar onSearch={onSearch} onCategorySelect={onCategorySelect} />
      <div className="news-feed grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-2 gap-y-9 p-4">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full text-center text-gray-600">
            No news found for this category.
          </div>
        ) : (
          filteredArticles.map((article, idx) => (
            <ArticleCard
              key={idx}
              article={article}
              onClick={setSelectedArticle}
            />
          ))
        )}
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          article={selectedArticle}
        />
      </div>
    </>
  );
};

export default NewsFeed;
