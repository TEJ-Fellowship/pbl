import { useState } from "react";
import { ThemeProvider } from 'next-themes'
import NewsFeed from "./components/NewsFeed";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
    <NewsFeed
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
      searchKeyword={searchKeyword}
      onSearch={setSearchKeyword}
    />
  </ThemeProvider>
  
  );
}
