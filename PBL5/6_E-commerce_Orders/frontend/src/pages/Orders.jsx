import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ordersApi } from '../lib/api';
import { formatPrice, formatDate } from '../lib/utils';
import { Package, Eye, X } from 'lucide-react';

export function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const params = {
          page: currentPage,
          limit: 10,
          ...(filterStatus && { status: filterStatus }),
        };
        const data = await ordersApi.getMyOrders(params);
        setOrders(data.orders || []);
        setPagination(data.pagination || null);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentPage, filterStatus]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      const result = await ordersApi.cancel(orderId);
      if (result.success) {
        // Refresh orders
        const data = await ordersApi.getMyOrders({
          page: currentPage,
          limit: 10,
          ...(filterStatus && { status: filterStatus }),
        });
        setOrders(data.orders || []);
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

  if (loading && orders.length === 0) {
    return (
      <Container className="py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-1/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    );
  }

  if (orders.length === 0) {
    return (
      <Container className="py-8">
        <div className="text-center py-16">
          <Package className="w-24 h-24 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">No orders yet</h2>
          <p className="text-neutral-600 mb-6">Start shopping to see your orders here</p>
          <Link to="/products">
            <Button size="lg">Browse Products</Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <Container>
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">My Orders</h1>

        {/* Filter */}
        <div className="mb-6">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
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
                <div className="space-y-4">
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                        >
                          <div className="flex items-center space-x-3">
                            {item.product?.thumbnail_url && (
                              <img
                                src={item.product.thumbnail_url}
                                alt={item.product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div>
                              <p className="font-medium text-neutral-900">
                                {item.product?.title || 'Product'}
                              </p>
                              <p className="text-sm text-neutral-600">
                                Qty: {item.quantity} × {formatPrice(item.price_at_purchase)}
                              </p>
                            </div>
                          </div>
                          <p className="font-semibold text-neutral-900">
                            {formatPrice(item.price_at_purchase * item.quantity)}
                          </p>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-neutral-500 text-center pt-2">
                          +{order.items.length - 3} more item(s)
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <span className="text-lg font-semibold text-neutral-900">Total</span>
                    <span className="text-xl font-bold text-neutral-900">
                      {formatPrice(order.total_amount)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    {['pending', 'confirmed'].includes(order.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              disabled={currentPage === pagination.pages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}

