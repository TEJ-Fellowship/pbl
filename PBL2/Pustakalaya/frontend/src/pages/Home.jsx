import SearchBar from "../components/SearchBar";
import BooksSection from "../components/BooksSection";
import useBooks from "../hooks/useBooks";

const Home = () => {
  const { books, searchTerm, setSearchTerm, isLoading, error, reload } = useBooks();
  return (
    
      <main className="mx-auto max-w-7xl px-4 py-8">
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <h1 className="font-serif mb-6 text-2xl font-bold">Top Picks</h1>
        <BooksSection
        books={books}
        isLoading={isLoading}
        error={error}
        onRetry={reload}
        emptyMessage={
          searchTerm
            ? `No books found for "${searchTerm}".`
            : "No books available right now."
        }
      />
      </main>
    
  );
};

export default Home;
