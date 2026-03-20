import BookGrid from "../components/BookGrid";
import SearchBar from "../components/SearchBar";
import { dummyBooks } from "../data/dummyBooks";

const Home = () => {
  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <SearchBar />
        <h1 className="font-serif mb-6 text-2xl font-bold">Top Picks</h1>
        <BookGrid books={dummyBooks} />
      </main>
    </>
  );
};

export default Home;
