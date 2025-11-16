import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiMapPin, FiCreditCard, FiTag, FiGift, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { RootState } from '../store';
import { clearCart } from '../store/slices/cartSlice';
import { addToast } from '../store/slices/uiSlice';
import { createOrder, getShippingMethods, validateCoupon } from '../services/api';
import { loadStripe } from '@stripe/stripe-js';

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items, total: cartTotal } = useSelector((state: RootState) => state.cart);
  const { user } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');

  const [formData, setFormData] = useState({
    shippingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      phone: '',
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      phone: '',
    },
    paymentMethod: 'cod' as const,
    giftWrap: false,
    giftMessage: '',
    notes: '',
    sameAsBilling: true,
  });

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 0,
  });

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    fetchShippingMethods();
    calculateOrderSummary();
  }, [items, navigate]);

  useEffect(() => {
    if (selectedShipping) {
      calculateOrderSummary();
    }
  }, [selectedShipping, couponDiscount]);

  const fetchShippingMethods = async () => {
    try {
      const methods = await getShippingMethods();
      setShippingMethods(methods);
      if (methods.length > 0) {
        setSelectedShipping(methods[0]);
      }
    } catch (error) {
      console.error('Failed to fetch shipping methods:', error);
    }
  };

  const calculateOrderSummary = () => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.discountPrice || item.price;
      return sum + (price * item.quantity);
    }, 0);

    const discount = couponDiscount;
    const shipping = selectedShipping ? selectedShipping.price : 0;
    const tax = Math.round((subtotal - discount) * 0.18 * 100) / 100;
    const total = Math.max(0, subtotal - discount + shipping + tax);

    setOrderSummary({
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax,
      total: Math.round(total * 100) / 100,
    });
  };

  const handleAddressChange = (type: 'shipping' | 'billing', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Address`]: {
        ...prev[`${type}Address`],
        [field]: value,
      },
    }));
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      setLoading(true);
      const result = await validateCoupon(couponCode, orderSummary.subtotal);

      if (result.valid) {
        setCouponDiscount(result.discountAmount);
        setCouponError('');
        dispatch(addToast({
          type: 'success',
          message: `Coupon applied successfully! You saved ₹${result.discountAmount}`,
        }));
      } else {
        setCouponError(result.error || 'Invalid coupon code');
        setCouponDiscount(0);
      }
    } catch (error) {
      setCouponError('Failed to validate coupon');
      setCouponDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      const { shippingAddress } = formData;
      return !!(shippingAddress.street && shippingAddress.city &&
                shippingAddress.state && shippingAddress.pincode);
    }
    if (currentStep === 2) {
      return !!selectedShipping;
    }
    if (currentStep === 3) {
      return !!formData.paymentMethod;
    }
    return true;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      dispatch(addToast({
        type: 'error',
        message: 'Please fill in all required fields',
      }));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handlePlaceOrder = async () => {
    if (!validateCurrentStep()) {
      dispatch(addToast({
        type: 'error',
        message: 'Please complete all required fields',
      }));
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
          discountPrice: item.discountPrice,
        })),
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsBilling ? formData.shippingAddress : formData.billingAddress,
        paymentInfo: {
          method: formData.paymentMethod,
          amount: orderSummary.total,
        },
        shippingMethod: selectedShipping,
        couponCode: couponCode || undefined,
        giftWrap: formData.giftWrap,
        giftMessage: formData.giftMessage || undefined,
        notes: formData.notes || undefined,
      };

      const response = await createOrder(orderData);

      if (response.success) {
        dispatch(clearCart());
        dispatch(addToast({
          type: 'success',
          message: 'Order placed successfully!',
        }));

        // Redirect to order confirmation
        navigate(`/order-confirmation/${response.data.order._id}`);
      } else {
        throw new Error(response.error || 'Failed to place order');
      }
    } catch (error: any) {
      dispatch(addToast({
        type: 'error',
        message: error.message || 'Failed to place order',
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = () => {
    const steps = ['Address', 'Shipping', 'Payment', 'Review'];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep > index + 1
                    ? 'bg-green-600 text-white'
                    : currentStep === index + 1
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {currentStep > index + 1 ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep === index + 1 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                {step}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 ${
                    currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderShippingAddress = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.shippingAddress.street}
              onChange={(e) => handleAddressChange('shipping', 'street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.shippingAddress.city}
              onChange={(e) => handleAddressChange('shipping', 'city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              value={formData.shippingAddress.state}
              onChange={(e) => handleAddressChange('shipping', 'state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="State"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode *
            </label>
            <input
              type="text"
              value={formData.shippingAddress.pincode}
              onChange={(e) => handleAddressChange('shipping', 'pincode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="6-digit pincode"
              maxLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.shippingAddress.phone}
              onChange={(e) => handleAddressChange('shipping', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="10-digit mobile number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={formData.shippingAddress.landmark}
              onChange={(e) => handleAddressChange('shipping', 'landmark', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Nearby landmark"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="sameAsBilling"
            checked={formData.sameAsBilling}
            onChange={(e) => setFormData(prev => ({ ...prev, sameAsBilling: e.target.checked }))}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="sameAsBilling" className="ml-2 text-sm text-gray-900">
            Same as billing address
          </label>
        </div>

        {!formData.sameAsBilling && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.billingAddress.street}
                  onChange={(e) => handleAddressChange('billing', 'street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your street address"
                />
              </div>
              {/* Similar fields for billing address */}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderShippingMethod = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Select Shipping Method</h3>
        <div className="space-y-3">
          {shippingMethods.map((method) => (
            <label
              key={method.name}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="shipping"
                value={method.name}
                checked={selectedShipping?.name === method.name}
                onChange={() => setSelectedShipping(method)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{method.name}</span>
                  <span className="text-red-600 font-semibold">
                    {method.price === 0 ? 'FREE' : `₹${method.price}`}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {method.estimatedDays === 0
                    ? 'Same day delivery'
                    : `Delivery in ${method.estimatedDays} business days`}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
        <div className="space-y-3">
          {[
            { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive the order' },
            { value: 'credit_card', label: 'Credit Card', desc: 'Pay with your credit card' },
            { value: 'debit_card', label: 'Debit Card', desc: 'Pay with your debit card' },
            { value: 'upi', label: 'UPI', desc: 'Pay with any UPI app' },
            { value: 'net_banking', label: 'Net Banking', desc: 'Pay through your bank account' },
            { value: 'wallet', label: 'Wallet', desc: 'Pay with your preferred wallet' },
          ].map((method) => (
            <label
              key={method.value}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="payment"
                value={method.value}
                checked={formData.paymentMethod === method.value}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="font-medium">{method.label}</div>
                <div className="text-sm text-gray-600">{method.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Coupon Code</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            onClick={applyCoupon}
            disabled={loading || !couponCode.trim()}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            Apply
          </button>
        </div>
        {couponError && (
          <p className="mt-2 text-sm text-red-600">{couponError}</p>
        )}
        {couponDiscount > 0 && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-800">
                Coupon applied! You saved ₹{couponDiscount}
              </span>
              <button
                onClick={removeCoupon}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Gift Options</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.giftWrap}
              onChange={(e) => setFormData(prev => ({ ...prev, giftWrap: e.target.checked }))}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-900">Gift wrap this order (+₹30)</span>
          </label>

          {formData.giftWrap && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gift Message (Optional)
              </label>
              <textarea
                value={formData.giftMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, giftMessage: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Write your gift message here..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderOrderReview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-md"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-gray-600">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-red-600 font-semibold">
                      ₹{(item.discountPrice || item.price) * item.quantity}
                    </span>
                    {item.discountPrice && (
                      <span className="text-gray-500 line-through text-sm">
                        ₹{item.price * item.quantity}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Delivery Address</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Address:</strong> {formData.shippingAddress.street}
            </p>
            <p className="text-sm">
              {formData.shippingAddress.city}, {formData.shippingAddress.state} - {formData.shippingAddress.pincode}
            </p>
            {formData.shippingAddress.landmark && (
              <p className="text-sm">
                <strong>Landmark:</strong> {formData.shippingAddress.landmark}
              </p>
            )}
            {formData.shippingAddress.phone && (
              <p className="text-sm">
                <strong>Phone:</strong> {formData.shippingAddress.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{orderSummary.subtotal}</span>
            </div>
            {orderSummary.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{orderSummary.discount}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{orderSummary.shipping === 0 ? 'FREE' : `₹${orderSummary.shipping}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%)</span>
              <span>₹{orderSummary.tax}</span>
            </div>
            {formData.giftWrap && (
              <div className="flex justify-between">
                <span>Gift Wrap</span>
                <span>₹30</span>
              </div>
            )}
            <div className="border-t pt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-red-600">
                  ₹{orderSummary.total + (formData.giftWrap ? 30 : 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
          <div className="flex items-center space-x-3">
            <FiCreditCard className="h-5 w-5 text-gray-600" />
            <span>
              {formData.paymentMethod.replace('_', ' ').charAt(0).toUpperCase() +
               formData.paymentMethod.slice(1).replace('_', ' ')}
            </span>
          </div>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className="w-full px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <FiArrowLeft className="mr-2" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {renderProgressBar()}

        {currentStep === 1 && renderShippingAddress()}
        {currentStep === 2 && renderShippingMethod()}
        {currentStep === 3 && renderPaymentMethod()}
        {currentStep === 4 && renderOrderReview()}

        {currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;