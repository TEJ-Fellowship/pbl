import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Card, CardContent } from '../components/ui/Card';
import { productsApi } from '../lib/api';
import { useCart } from '../contexts/CartContext';
import { formatPrice, calculateDiscountPrice, getStockStatus } from '../lib/utils';
import { ShoppingCart, ArrowLeft, Minus, Plus, Check } from 'lucide-react';

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await productsApi.getById(id);
        setProduct(data.product);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <Container className="py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="w-full aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-8 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Product not found</h2>
        <Link to="/products">
          <Button>Back to Products</Button>
        </Link>
      </Container>
    );
  }

  const inventory = product.inventory || {};
  const stockStatus = getStockStatus(
    inventory.quantity || 0,
    inventory.reserved_quantity || 0
  );

  const finalPrice = calculateDiscountPrice(
    parseFloat(product.price),
    parseFloat(product.discount_percentage || 0)
  );

  const hasDiscount = product.discount_percentage > 0;
  const images = product.images || [];
  const mainImage = product.image_url || product.thumbnail_url;
  const allImages = mainImage ? [mainImage, ...images] : images;

  const handleAddToCart = async () => {
    if (stockStatus.status === 'out_of_stock') return;

    setAdding(true);
    const result = await addToCart(product.id, quantity);
    setAdding(false);

    if (result.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    }
  };

  const maxQuantity = Math.min(stockStatus.available, 99);

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        {/* Back Button */}
        <Link
          to="/products"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-xl overflow-hidden border border-neutral-200">
              {allImages.length > 0 ? (
                <img
                  src={allImages[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                  <span className="text-neutral-400">No image available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.slice(0, 4).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-primary-600 ring-2 ring-primary-200'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category */}
            {product.category && (
              <Link
                to={`/products?category=${product.category.id}`}
                className="inline-block"
              >
                <Badge variant="primary">{product.category.name}</Badge>
              </Link>
            )}

            {/* Title */}
            <h1 className="text-4xl font-bold text-neutral-900">{product.title}</h1>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-bold text-neutral-900">
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-2xl text-neutral-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <Badge variant="danger" className="text-lg px-3 py-1">
                    -{product.discount_percentage}% OFF
                  </Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {stockStatus.status === 'out_of_stock' ? (
                <Badge variant="danger">Out of Stock</Badge>
              ) : stockStatus.status === 'low_stock' ? (
                <Badge variant="warning">
                  Only {stockStatus.available} left in stock
                </Badge>
              ) : (
                <Badge variant="success">In Stock</Badge>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">Description</h3>
                <p className="text-neutral-600 whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Product Details */}
            <Card>
              <CardContent className="space-y-3">
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Brand</span>
                    <span className="font-medium text-neutral-900">{product.brand}</span>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">SKU</span>
                    <span className="font-medium text-neutral-900">{product.sku}</span>
                  </div>
                )}
                {product.rating && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Rating</span>
                    <span className="font-medium text-neutral-900">
                      {parseFloat(product.rating).toFixed(1)} / 5.0
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-neutral-700">Quantity</label>
                <div className="flex items-center border border-neutral-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setQuantity(Math.min(Math.max(1, val), maxQuantity));
                    }}
                    className="w-16 text-center border-0 focus:outline-none focus:ring-0"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="p-2 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={stockStatus.status === 'out_of_stock' || adding}
                loading={adding}
                onClick={handleAddToCart}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>

            {/* Additional Info */}
            {(product.warranty_information || product.shipping_information || product.return_policy) && (
              <Card>
                <CardContent className="space-y-4">
                  {product.warranty_information && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">Warranty</h4>
                      <p className="text-sm text-neutral-600">{product.warranty_information}</p>
                    </div>
                  )}
                  {product.shipping_information && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">Shipping</h4>
                      <p className="text-sm text-neutral-600">{product.shipping_information}</p>
                    </div>
                  )}
                  {product.return_policy && (
                    <div>
                      <h4 className="font-semibold text-neutral-900 mb-1">Returns</h4>
                      <p className="text-sm text-neutral-600">{product.return_policy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

