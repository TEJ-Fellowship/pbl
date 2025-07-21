import { useState } from "react";
import NewsFeed from "./components/NewsFeed";

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  return (
    <NewsFeed
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
      searchKeyword={searchKeyword}
      onSearch={setSearchKeyword}
    />
  );
}
