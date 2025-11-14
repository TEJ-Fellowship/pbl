import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ordersApi } from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import { ArrowLeft, X, Package, MapPin, CreditCard } from 'lucide-react';

export function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await ordersApi.getById(id);
        setOrder(data.order);
      } catch (error) {
        console.error('Failed to fetch order:', error);
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchOrder();
    }
  }, [id, navigate]);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const result = await ordersApi.cancel(id);
      if (result.success) {
        navigate('/orders');
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (loading) {
    return (
      <Container className="py-8">
        <Skeleton className="h-8 w-1/4 mb-6" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-8 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Order not found</h2>
        <Link to="/orders">
          <Button>Back to Orders</Button>
        </Link>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        {/* Back Button */}
        <Link
          to="/orders"
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="mb-2">Order #{order.id.slice(0, 8)}</CardTitle>
                    <p className="text-sm text-neutral-600">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
              </CardHeader>
              <CardContent>
                {order.confirmed_at && (
                  <p className="text-sm text-neutral-600 mb-4">
                    Confirmed on {formatDate(order.confirmed_at)}
                  </p>
                )}
                {order.cancelled_at && (
                  <p className="text-sm text-red-600 mb-4">
                    Cancelled on {formatDate(order.cancelled_at)}
                  </p>
                )}
                {['pending', 'confirmed'].includes(order.status) && (
                  <Button
                    variant="outline"
                    onClick={handleCancelOrder}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items && order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 py-4 border-b border-neutral-100 last:border-0"
                    >
                      {item.product?.thumbnail_url && (
                        <img
                          src={item.product.thumbnail_url}
                          alt={item.product.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">
                          {item.product?.title || 'Product'}
                        </h4>
                        <p className="text-sm text-neutral-600">
                          Quantity: {item.quantity}
                        </p>
                        <p className="text-sm text-neutral-600">
                          Price: {formatPrice(item.price_at_purchase)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          {formatPrice(item.price_at_purchase * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-neutral-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-neutral-600 space-y-1">
                    {typeof order.shipping_address === 'string' ? (
                      <p>{order.shipping_address}</p>
                    ) : (
                      <>
                        {order.shipping_address.name && <p>{order.shipping_address.name}</p>}
                        {order.shipping_address.street && <p>{order.shipping_address.street}</p>}
                        {(order.shipping_address.city || order.shipping_address.state) && (
                          <p>
                            {order.shipping_address.city}
                            {order.shipping_address.city && order.shipping_address.state && ', '}
                            {order.shipping_address.state} {order.shipping_address.zipCode}
                          </p>
                        )}
                        {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Info */}
            {order.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Status</span>
                    <Badge
                      variant={
                        order.payment.status === 'succeeded'
                          ? 'success'
                          : order.payment.status === 'failed'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {order.payment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Method</span>
                    <span className="font-medium">{order.payment_method || 'N/A'}</span>
                  </div>
                  {order.payment.transaction_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Transaction ID</span>
                      <span className="font-mono text-xs">{order.payment.transaction_id}</span>
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

