import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { createMockStore } from '@reduxjs/toolkit';

import ProductCard from '../ProductCard';
import { RootState } from '../../store';
import { createMockProduct } from '../../utils/setupTests';

const mockStore = createMockStore<RootState>({
  auth: {
    isAuthenticated: true,
    user: {
      _id: '1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    },
  },
  products: {
    isLoading: false,
  products: [createMockProduct()],
  },
  cart: {
    totalItems: 2,
    items: [
      {
        productId: '1',
        name: 'Test Product 1',
        price: 100,
        discountPrice: 80,
        size: 'M',
        color: 'Red',
        quantity: 2,
        image: '/product1.jpg',
      },
      {
        productId: '2',
        name: 'Test Product 2',
        price: 200,
        size: 'L',
        color: 'Blue',
        quantity: 1,
        image: '/product2.jpg',
      },
    ],
  },
});

const renderProductCard = (overrides = {}) => {
  const defaultProps = {
    product: createMockProduct(),
    onAddToCart: jest.fn(),
    onToggleWishlist: jest.fn(),
    onQuickView: jest.fn(),
  };

  const product = { ...defaultProps.product, ...overrides };

  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        <ProductCard
          {...product}
          {...defaultProps}
          {...overrides}
        />
      </BrowserRouter>
    </Provider>
  );
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    renderProductCard();
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(product.brand)).toBeInTheDocument();
    expect(screen.getByText('₹' + product.discountPrice.toString())).toBeInTheDocument();
  });

  it('displays discount percentage when applicable', () => {
    const productWithDiscount = createMockProduct({ discountPrice: 80 });
    renderProductCard({ product: productWithDiscount });

    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });

  it('renders original price when discount exists', () => {
    const productWithDiscount = createMockProduct({ discountPrice: 80 });
    renderProductCard({ product: productWithDiscount });

    expect(screen.getByText('₹200')).toBeInTheDocument();
    expect(screen.getByText('₹80')).toHaveClass('line-through');
  });

  it('calls onAddToCart when button is clicked', () => {
    const mockOnAddToCart = jest.fn();
    renderProductCard({ onAddToCart: mockOnAddToCart });

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    expect(mockOnAddToCart).toHaveBeenCalledWith(
      product,
      'M',
      'Red'
    );
  });

  it('calls onToggleWishlist when button is clicked', () => {
    const mockOnToggleWishlist = jest.fn();
    renderProductCard({ onToggleWishlist: mockOnToggleWishlist });

    const wishlistButton = screen.getByRole('button', { name: /toggle wishlist/i });
    fireEvent.click(wishlistButton);

    expect(mockOnToggleWishlist).toHaveBeenCalledWith(product);
  });

  it('calls onQuickView when quick view button is clicked', () => {
    const mockOnQuickView = jest.fn();
    renderProductCard({ onQuickView: mockOnQuickView });

    const quickViewButton = screen.getByRole('button', { name: /quick view/i });
    fireEvent.click(quickViewButton);

    expect(mockOnQuickView).toHaveBeenCalledWith(product);
  });

  it('is responsive and displays correctly on different screen sizes', () => {
    const { container } = renderProductCard();

    // Mobile view
    expect(container.firstChild).toHaveClass('grid');
    expect(container).toHaveClass('md:grid-cols-2');

    // Desktop view
    Object.defineProperty(container, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(container, 'clientHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    expect(container.firstChild).toHaveClass('lg:grid-cols-4');
  });
});