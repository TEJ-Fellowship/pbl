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

export default categorizeArticle;