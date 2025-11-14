import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { formatPrice, calculateDiscountPrice, getStockStatus } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useCart } from '../../contexts/CartContext';
import { useState } from 'react';

export function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);
  
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

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (stockStatus.status === 'out_of_stock') return;
    
    setAdding(true);
    await addToCart(product.id, 1);
    setAdding(false);
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white rounded-xl shadow-soft border border-neutral-200 overflow-hidden hover:shadow-medium transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        <img
          src={product.thumbnail_url || product.image_url || '/placeholder-product.jpg'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          decoding="async"
          width="400"
          height="400"
        />
        {hasDiscount && (
          <Badge variant="danger" className="absolute top-3 left-3">
            -{product.discount_percentage}%
          </Badge>
        )}
        {stockStatus.status === 'out_of_stock' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="outline" className="bg-white">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        {product.category && (
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {product.category.name}
          </p>
        )}

        {/* Title */}
        <h3 className="font-semibold text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.title || 'Untitled Product'}
        </h3>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-neutral-600 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm text-neutral-600">
              {parseFloat(product.rating).toFixed(1)}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-neutral-900">
            {formatPrice(finalPrice)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-neutral-500 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {stockStatus.status === 'low_stock' && (
          <p className="text-xs text-yellow-600 font-medium">
            Only {stockStatus.available} left in stock
          </p>
        )}

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          disabled={
            stockStatus.status === 'out_of_stock' || 
            adding || 
            (product.minimum_order_quantity && stockStatus.available < product.minimum_order_quantity)
          }
          loading={adding}
          onClick={handleAddToCart}
          aria-label={`Add ${product.title} to cart`}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          {stockStatus.status === 'out_of_stock' 
            ? 'Out of Stock' 
            : (product.minimum_order_quantity && stockStatus.available < product.minimum_order_quantity)
            ? `Min: ${product.minimum_order_quantity}`
            : 'Add to Cart'}
        </Button>
      </div>
    </Link>
  );
}

