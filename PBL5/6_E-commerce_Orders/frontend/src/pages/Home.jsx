import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { ProductGrid } from '../components/products/ProductGrid';
import { Button } from '../components/ui/Button';
import { productsApi } from '../lib/api';

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch featured products (first page, sorted by newest)
        const productsData = await productsApi.getAll({
          page: 1,
          limit: 8,
          sortBy: 'created_at',
          order: 'DESC',
        });
        setFeaturedProducts(productsData.products || []);

        // Fetch categories
        const categoriesData = await productsApi.getCategories();
        setCategories(categoriesData.categories || []);
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20 md:py-32">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white rounded-full shadow-soft mb-6">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-neutral-700">Premium Quality</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6">
              Discover Premium
              <span className="block text-primary-600">Products</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8">
              Experience exceptional quality and design with our curated collection of premium products.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/products">
                <Button size="lg" className="w-full sm:w-auto">
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <Container>
            <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
              Shop by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  to={`/products?category=${category.id}`}
                  className="group p-6 bg-neutral-50 rounded-xl hover:bg-primary-50 transition-colors text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-16 bg-neutral-50">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-neutral-900">Featured Products</h2>
            <Link to="/products">
              <Button variant="ghost">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <ProductGrid products={featuredProducts} loading={loading} />
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-accent-600">
        <Container>
          <div className="text-center text-white max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Shopping?
            </h2>
            <p className="text-lg text-primary-100 mb-8">
              Explore our full collection of premium products and find exactly what you're looking for.
            </p>
            <Link to="/products">
              <Button size="lg" variant="secondary">
                Browse All Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}

