import { useEffect, useState, useMemo, startTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { ProductGrid } from '../components/products/ProductGrid';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ErrorState, EmptyState } from '../components/ui/ErrorState';
import { useProducts } from '../hooks/useProducts';
import { productsApi } from '../lib/api';
import { Search, Filter, X } from 'lucide-react';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState(null);
  
  // Filters - initialize from URL params
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'created_at');
  const [order, setOrder] = useState(() => searchParams.get('order') || 'DESC');
  const [currentPage, setCurrentPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [showFilters, setShowFilters] = useState(false);

  // Memoize product params to prevent unnecessary re-renders
  const productParams = useMemo(() => ({
    page: currentPage,
    limit: 20,
    ...(selectedCategory && { category: selectedCategory }),
    ...(search && { search }),
    ...(minPrice && { minPrice }),
    ...(maxPrice && { maxPrice }),
    sortBy,
    order,
  }), [currentPage, selectedCategory, search, minPrice, maxPrice, sortBy, order]);

  // Use custom hook for products
  const { products, pagination, loading, error, retry } = useProducts(productParams);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesError(null);
        const data = await productsApi.getCategories();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategoriesError('Failed to load categories');
      }
    };
    fetchCategories();
  }, []);

  const updateSearchParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    startTransition(() => {
      setSearchParams(newParams);
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateSearchParams({ search, page: '1' });
  };

  const handleFilterChange = (key, value) => {
    setCurrentPage(1);
    updateSearchParams({ [key]: value, page: '1' });
  };

  const clearFilters = () => {
    startTransition(() => {
      setSearch('');
      setSelectedCategory('');
      setMinPrice('');
      setMaxPrice('');
      setSortBy('created_at');
      setOrder('DESC');
      setCurrentPage(1);
      setSearchParams({});
    });
  };

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || search;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Products</h1>
          <p className="text-neutral-600">Discover our premium collection</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-soft border border-neutral-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </form>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={`${sortBy}-${order}`}
                onChange={(e) => {
                  const [newSortBy, newOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setOrder(newOrder);
                  handleFilterChange('sortBy', newSortBy);
                  handleFilterChange('order', newOrder);
                }}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="created_at-DESC">Newest First</option>
                <option value="created_at-ASC">Oldest First</option>
                <option value="price-ASC">Price: Low to High</option>
                <option value="price-DESC">Price: High to Low</option>
                <option value="title-ASC">Name: A to Z</option>
                <option value="title-DESC">Name: Z to A</option>
              </select>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {(showFilters || window.innerWidth >= 1024) && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      handleFilterChange('category', e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Filters */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Min Price
                  </label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      handleFilterChange('minPrice', e.target.value);
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Max Price
                  </label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      handleFilterChange('maxPrice', e.target.value);
                    }}
                  />
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && !loading && (
          <ErrorState error={error} onRetry={retry} title="Failed to load products" />
        )}

        {/* Products Grid */}
        {!error && <ProductGrid products={products} loading={loading} onRefresh={retry} />}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(currentPage - 1);
                updateSearchParams({ page: String(currentPage - 1) });
              }}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                let pageNum;
                if (pagination.pages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(pageNum);
                      updateSearchParams({ page: String(pageNum) });
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              disabled={currentPage === pagination.pages}
              onClick={() => {
                setCurrentPage(currentPage + 1);
                updateSearchParams({ page: String(currentPage + 1) });
              }}
            >
              Next
            </Button>
          </div>
        )}

        {/* Results Count */}
        {pagination && (
          <p className="mt-4 text-center text-sm text-neutral-500">
            Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} products
          </p>
        )}
      </Container>
    </div>
  );
}

