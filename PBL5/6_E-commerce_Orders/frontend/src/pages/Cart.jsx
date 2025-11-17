import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../lib/utils';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { ordersApi } from '../lib/api';

export function Cart() {
  const navigate = useNavigate();
  const { items, total, itemCount, updateQuantity, removeFromCart, loading: cartLoading } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [errors, setErrors] = useState({});

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(productId);
    } else {
      await updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
    // Validate form
    const newErrors = {};
    if (!shippingAddress.name) newErrors.name = 'Name is required';
    if (!shippingAddress.street) newErrors.street = 'Street address is required';
    if (!shippingAddress.city) newErrors.city = 'City is required';
    if (!shippingAddress.state) newErrors.state = 'State is required';
    if (!shippingAddress.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (!shippingAddress.country) newErrors.country = 'Country is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setCheckoutLoading(true);

    try {
      const result = await ordersApi.checkout(shippingAddress);
      if (result.success) {
        navigate(`/orders/${result.order.id}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.message || 'Failed to process checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (cartLoading && items.length === 0) {
    return (
      <Container className="py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container className="py-8">
        <div className="text-center py-16">
          <ShoppingBag className="w-24 h-24 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
          <p className="text-neutral-600 mb-6">Start shopping to add items to your cart</p>
          <Link to="/products">
            <Button size="lg">
              Browse Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.productId}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <Link
                      to={`/products/${item.productId}`}
                      className="flex-shrink-0 w-full sm:w-32 h-32 bg-neutral-100 rounded-lg overflow-hidden"
                    >
                      <img
                        src={item.product.image || '/placeholder-product.jpg'}
                        alt={item.product.title}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <Link
                          to={`/products/${item.productId}`}
                          className="text-lg font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
                        >
                          {item.product.title}
                        </Link>
                        <p className="text-neutral-600 mt-1">
                          {formatPrice(item.price)} each
                        </p>
                        {item.product.stock !== undefined && (
                          <Badge
                            variant={item.product.stock > 0 ? 'success' : 'danger'}
                            className="mt-2"
                          >
                            {item.product.stock > 0
                              ? `${item.product.stock} in stock`
                              : 'Out of stock'}
                          </Badge>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center border border-neutral-300 rounded-lg">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                            disabled={cartLoading}
                            className="p-2 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                            disabled={cartLoading || item.quantity >= item.product.stock}
                            className="p-2 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right min-w-[6rem]">
                          <p className="text-lg font-semibold text-neutral-900">
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          disabled={cartLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-neutral-600">
                  <span>Items ({itemCount})</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-4">
                  <div className="flex justify-between text-xl font-bold text-neutral-900">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setShowCheckout(true)}
                  disabled={cartLoading}
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>

                <Link to="/products">
                  <Button variant="ghost" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>

      {/* Checkout Modal */}
      <Modal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Shipping Information"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={shippingAddress.name}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, name: e.target.value })
            }
            error={errors.name}
            required
          />
          <Input
            label="Street Address"
            value={shippingAddress.street}
            onChange={(e) =>
              setShippingAddress({ ...shippingAddress, street: e.target.value })
            }
            error={errors.street}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              value={shippingAddress.city}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, city: e.target.value })
              }
              error={errors.city}
              required
            />
            <Input
              label="State"
              value={shippingAddress.state}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, state: e.target.value })
              }
              error={errors.state}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="ZIP Code"
              value={shippingAddress.zipCode}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, zipCode: e.target.value })
              }
              error={errors.zipCode}
              required
            />
            <Input
              label="Country"
              value={shippingAddress.country}
              onChange={(e) =>
                setShippingAddress({ ...shippingAddress, country: e.target.value })
              }
              error={errors.country}
              required
            />
          </div>
          <div className="flex gap-4 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowCheckout(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCheckout}
              loading={checkoutLoading}
            >
              Complete Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

