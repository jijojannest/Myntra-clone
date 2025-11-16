interface ShippingMethod {
  name: string;
  price: number;
  estimatedDays: number;
}

interface CouponData {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minAmount: number;
  maxDiscount?: number;
  applicableCategories: string[];
  userUsageLimit: number;
  globalUsageLimit: number;
  startDate: Date;
  endDate: Date;
}

export const calculateShipping = (shippingMethod: ShippingMethod, orderTotal: number): number => {
  // Free shipping for orders above certain amount
  const freeShippingThreshold = 999;

  if (orderTotal >= freeShippingThreshold) {
    return 0;
  }

  return shippingMethod.price;
};

export const calculateTax = (subtotal: number, taxRate: number = 0.18): number => {
  return Math.round(subtotal * taxRate * 100) / 100; // Round to 2 decimal places
};

export const applyCoupon = async (
  couponCode: string,
  orderTotal: number,
  userId: string
): Promise<{
  valid: boolean;
  discount: number;
  discountAmount: number;
  error?: string;
}> => {
  const Coupon = require('../models/Coupon').Coupon;

  try {
    // Find coupon
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true
    });

    if (!coupon) {
      return {
        valid: false,
        discount: 0,
        discountAmount: 0,
        error: 'Invalid coupon code',
      };
    }

    // Check if coupon is expired
    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      return {
        valid: false,
        discount: 0,
        discountAmount: 0,
        error: 'Coupon has expired',
      };
    }

    // Check minimum order amount
    if (orderTotal < coupon.minAmount) {
      return {
        valid: false,
        discount: 0,
        discountAmount: 0,
        error: `Minimum order amount of ₹${coupon.minAmount} required`,
      };
    }

    // Check user usage limit
    const Order = require('../models/Order').Order;
    const userUsageCount = await Order.countDocuments({
      userId,
      couponCode: coupon.code,
    });

    if (userUsageCount >= coupon.userUsageLimit) {
      return {
        valid: false,
        discount: 0,
        discountAmount: 0,
        error: 'Coupon usage limit exceeded',
      };
    }

    // Check global usage limit
    const globalUsageCount = await Order.countDocuments({
      couponCode: coupon.code,
    });

    if (globalUsageCount >= coupon.globalUsageLimit) {
      return {
        valid: false,
        discount: 0,
        discountAmount: 0,
        error: 'Coupon has been fully redeemed',
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderTotal * coupon.discount) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discount;
    }

    return {
      valid: true,
      discount: coupon.discount,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  } catch (error) {
    console.error('Coupon validation error:', error);
    return {
      valid: false,
      discount: 0,
      discountAmount: 0,
      error: 'Failed to validate coupon',
    };
  }
};

export const calculateOrderTotal = (
  items: Array<{
    price: number;
    discountPrice?: number;
    quantity: number;
  }>,
  shippingMethod: ShippingMethod,
  couponCode?: string,
  couponDiscount?: number
): {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
} => {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const price = item.discountPrice || item.price;
    return sum + (price * item.quantity);
  }, 0);

  // Calculate discount
  let discount = 0;
  if (couponDiscount) {
    discount = couponDiscount;
  }

  // Calculate shipping
  const shipping = calculateShipping(shippingMethod, subtotal);

  // Calculate tax (on subtotal after discount, excluding shipping)
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = calculateTax(taxableAmount);

  // Calculate total
  const total = Math.max(0, subtotal - discount + shipping + tax);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    shipping: Math.round(shipping * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

export const calculateExchangeAmount = (
  originalItem: { price: number; discountPrice?: number },
  newItem: { price: number; discountPrice?: number }
): number => {
  const originalPrice = originalItem.discountPrice || originalItem.price;
  const newItemPrice = newItem.discountPrice || newItem.price;

  const difference = newItemPrice - originalPrice;

  // If new item is more expensive, user pays the difference
  // If new item is cheaper, user gets store credit
  return Math.max(0, difference);
};

export const calculateLoyaltyPoints = (orderTotal: number): number => {
  // 1 point per ₹10 spent
  return Math.floor(orderTotal / 10);
};

export const getLoyaltyPointsValue = (points: number): number => {
  // 100 points = ₹10
  return (points / 100) * 10;
};

export const applyLoyaltyPoints = (
  orderTotal: number,
  pointsToUse: number,
  availablePoints: number
): {
  discountedTotal: number;
  pointsUsed: number;
  remainingPoints: number;
} => {
  const usablePoints = Math.min(pointsToUse, availablePoints);
  const discount = getLoyaltyPointsValue(usablePoints);
  const discountedTotal = Math.max(0, orderTotal - discount);

  return {
    discountedTotal: Math.round(discountedTotal * 100) / 100,
    pointsUsed: usablePoints,
    remainingPoints: availablePoints - usablePoints,
  };
};

export const calculateEMI = (
  totalAmount: number,
  tenureMonths: number,
  interestRate: number = 12
): Array<{
  months: number;
  monthlyAmount: number;
  totalInterest: number;
  totalAmount: number;
}> => {
  const emiPlans = [];

  for (const months of [3, 6, 9, 12]) {
    if (months <= tenureMonths) {
      const monthlyRate = interestRate / 12 / 100;
      const emi = (totalAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                  (Math.pow(1 + monthlyRate, months) - 1);
      const totalAmountPaid = emi * months;
      const totalInterest = totalAmountPaid - totalAmount;

      emiPlans.push({
        months,
        monthlyAmount: Math.round(emi * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalAmount: Math.round(totalAmountPaid * 100) / 100,
      });
    }
  }

  return emiPlans;
};

export const getShippingMethods = (pincode: string): Promise<ShippingMethod[]> => {
  return new Promise((resolve) => {
    // In a real implementation, this would check with shipping partners
    // based on pincode serviceability
    const methods: ShippingMethod[] = [
      {
        name: 'Standard Delivery',
        price: 40,
        estimatedDays: 5,
      },
      {
        name: 'Express Delivery',
        price: 80,
        estimatedDays: 2,
      },
      {
        name: 'Premium Delivery',
        price: 120,
        estimatedDays: 1,
      },
    ];

    // Simulate different shipping options based on pincode
    const metroPincodes = ['400', '110', '560', '600', '700', '500', '380', '411'];
    const isMetro = metroPincodes.some(code => pincode.startsWith(code));

    if (isMetro) {
      methods.push({
        name: 'Same Day Delivery',
        price: 150,
        estimatedDays: 0,
      });
    }

    resolve(methods);
  });
};