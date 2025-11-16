# Myntra Clone Mobile - Component Library

This document provides comprehensive information about all reusable components used in the Myntra Clone mobile application.

## 🏗️ Component Structure

```
src/components/
├── common/           # Common UI components
├── forms/            # Form components
├── product/          # Product-related components
├── navigation/        # Navigation components
├── cart/             # Shopping cart components
├── profile/           # User profile components
├── loading/          # Loading and feedback components
├── modals/           # Modal dialogs
└── ui/               # UI elements and widgets
```

## 🎨 Common Components

### Button
`src/components/common/Button.tsx`

```typescript
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  onPress: () => void;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  onPress,
  iconPosition = 'left',
  style,
  fullWidth = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 8,
      paddingVertical: size === 'small' ? 8 : size === 'large' ? 16 : 12,
      paddingHorizontal: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    };

    const variantStyle = {
      primary: styles.primaryButton,
      secondary: styles.secondaryButton,
      outline: styles.outlineButton,
      text: styles.textButton,
    };

    return StyleSheet.flatten([baseStyle, variantStyle[variant]]);
  };

  const getTextColor = () => {
    const colorMap = {
      primary: '#fff',
      secondary: '#E53935',
      outline: '#E53935',
      text: '#E53935',
    };
    return colorMap[variant];
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), fullWidth && styles.fullWidth]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={disabled ? 0.5 : 1}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getTextColor()}
              style={styles.leftIcon}
            />
          )}
          <Text style={[styles.buttonText, { color: getTextColor() }]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              color={getTextColor()}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#E53935',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  outlineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
```

### Input Field
`src/components/common/InputField.tsx`

```typescript
interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  returnKeyType?: KeyboardTypeOptions;
  rightIcon?: string;
  rightIconPress?: () => void;
  style?: ViewStyle;
  editable?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType,
  error,
  multiline = false,
  numberOfLines = 1,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType = 'next',
  rightIcon,
  rightIconPress,
  style,
  editable = true,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          editable={editable}
        />
        {rightIcon && (
          <TouchableOpacity style={styles.rightIcon} onPress={rightIconPress}>
            <Icon name={rightIcon} size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#E53935',
  },
  errorContainer: {
    borderColor: '#E53935',
  },
  rightIcon: {
    padding: 8,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginTop: 4,
  },
});

export default InputField;
```

### Card Component
`src/components/common/Card.tsx`

```typescript
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: number;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  backgroundColor?: string;
  shadowColor?: string;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  elevation = 2,
  padding = 16,
  margin = 8,
  borderRadius = 8,
  backgroundColor = '#fff',
  shadowColor = '#000',
  onPress,
}) => {
  const cardStyle = {
    backgroundColor,
    borderRadius,
    padding,
    margin,
    elevation,
    shadowColor,
    shadowOffset: { width: 0, height: elevation },
    shadowOpacity: 0.1,
    shadowRadius: elevation,
    ...style,
  };

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};

export default Card;
```

## 🛍️ Product Components

### Product Card
`src/components/product/ProductCard.tsx`

```typescript
interface ProductCardProps {
  product: Product;
  variant?: ProductVariant;
  inCart?: boolean;
  inWishlist?: boolean;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (product: Product) => void;
  onPress: (product: Product) => void;
  onSizeSelect?: (size: string) => void;
  onColorSelect?: (color: string) => void;
  showSizeSelector?: boolean;
  showColorSelector?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  variant,
  inCart = false,
  inWishlist = false,
  onAddToCart,
  onAddToWishlist,
  onPress,
  onSizeSelect,
  onColorSelect,
  showSizeSelector = false,
  showColorSelector = false,
}) => {
  const effectivePrice = variant?.discountPrice || product.price;
  const discount = product.price && variant?.discountPrice
    ? Math.round(((product.price - variant.discountPrice) / product.price) * 100)
    : 0;

  const renderSizeSelector = () => {
    if (!showSizeSelector || !onSizeSelect) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.sizeSelector}>
          {product.variants.map((variant) => (
            <TouchableOpacity
              key={variant.id}
              style={[
                styles.sizeOption,
                variant.size === selectedSize && styles.selectedSizeOption
              ]}
              onPress={() => onSizeSelect(variant.size)}
            >
              <Text style={styles.sizeText}>{variant.size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderColorSelector = () => {
    if (!showColorSelector || !onColorSelect) return null;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.colorSelector}>
          {product.colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                color === selectedColor && styles.selectedColorOption
              ]}
              onPress={() => onColorSelect(color)}
            >
              <View style={[styles.colorCircle, { backgroundColor: color }]} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <Card onPress={onPress}>
      <FastImage
        source={{ uri: variant?.images[0] || product.images[0] }}
        style={styles.productImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      {discount > 0 && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{discount}% OFF</Text>
        </View>
      )}

      <View style={styles.productInfo}>
        <Text style={styles.brandText}>{product.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>
          ₹{effectivePrice}
          {variant?.discountPrice && (
            <Text style={styles.originalPrice}>₹{product.price}</Text>
          )}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, inCart && styles.inCartButton]}
          onPress={() => onAddToCart(product)}
        >
          <Icon name={inCart ? 'shopping-cart' : 'add-shopping-cart'} size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onAddToWishlist(product)}
        >
          <Icon name={inWishlist ? 'favorite' : 'favorite-border'} size={20} color="#E53935" />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#E53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  brandText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecoration: 'line-through',
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 6,
    padding: 8,
  },
  inCartButton: {
    backgroundColor: '#E53935',
  },
  sizeSelector: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  sizeOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sizeText: {
    fontSize: 14,
    color: '#333',
  },
  colorSelector: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedSizeOption: {
    backgroundColor: '#E53935',
    borderColor: '#E53935',
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: '#E53935',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});

export default ProductCard;
```

### Product Image Carousel
`src/components/product/ProductCarousel.tsx`

```typescript
import React from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width: screenWidth } = Dimensions.get('window');

interface ProductCarouselProps {
  images: string[];
  onImagePress: (index: number) => void;
  autoplay?: boolean;
  showIndicators?: boolean;
  imageStyle?: ImageStyle;
  height?: number;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  images,
  onImagePress,
  autoplay = false,
  showIndicators = true,
  imageStyle,
  height = 250,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const index = Math.round(contentOffset.x / screenWidth);
    setCurrentIndex(index);
  };

  const scrollToIndex = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: index * screenWidth, animated: true });
      setCurrentIndex(index);
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageContainer}
            onPress={() => onImagePress(index)}
            activeOpacity={1}
          >
            <FastImage
              source={{ uri: image }}
              style={[
                styles.image,
                imageStyle,
                { width: screenWidth, height }
              ]}
              resizeMode={FastImage.resizeMode.contain}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showIndicators && (
        <View style={styles.indicatorContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                currentIndex === index && styles.activeIndicator
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.arrowButtons}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => scrollToIndex(Math.max(0, currentIndex - 1))}
        >
          <Icon name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => scrollToIndex(Math.min(images.length - 1, currentIndex + 1))}
        >
          <Icon name="chevron-right" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    height,
  },
  imageContainer: {
    width: screenWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#E53935',
  },
  arrowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'absolute',
    top: '50%',
    width: '100%',
    paddingHorizontal: 20,
  },
  arrowButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProductCarousel;
```

## 🛒 Shopping Cart Components

### Cart Item
`src/components/cart/CartItem.tsx`

```typescript
interface CartItemProps {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onMoveToWishlist: () => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onRemove,
  onMoveToWishlist,
}) => {
  const handleIncreaseQuantity = () => {
    const newQuantity = Math.min(item.quantity + 1, item.variant.stock);
    onQuantityChange(newQuantity);
  };

  const handleDecreaseQuantity = () => {
    const newQuantity = Math.max(1, item.quantity - 1);
    onQuantityChange(newQuantity);
  };

  return (
    <Card style={styles.container}>
      <FastImage
        source={{ uri: item.variant.images[0] || item.product.images[0] }}
        style={styles.productImage}
        resizeMode={FastImage.resizeMode.cover}
      />

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.variantInfo}>
          {item.variant.size} • {item.variant.color}
        </Text>
        <Text style={styles.price}>
          ₹{(item.variant.discountPrice || item.variant.price) * item.quantity}
        </Text>
      </View>

      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleDecreaseQuantity}
        >
          <Icon name="minus-circle" size={20} color="#E53935" />
        </TouchableOpacity>

        <Text style={styles.quantity}>{item.quantity}</Text>

        <TouchableOpacity
          style={styles.quantityButton}
          onPress={handleIncreaseQuantity}
          disabled={item.quantity >= item.variant.stock}
        >
          <Icon name="plus-circle" size={20} color={item.quantity >= item.variant.stock ? "#ccc" : "#E53935"} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onMoveToWishlist}
        >
          <Icon name="favorite-border" size={20} color="#E53935" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Icon name="trash-2" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  variantInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    padding: 8,
  },
  removeButton: {
    backgroundColor: '#E53935',
    borderRadius: 6,
    padding: 8,
  },
});

export default CartItem;
```

### Cart Summary
`src/components/cart/CartSummary.tsx`

```typescript
interface CartSummaryProps {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  onCheckout: () => void;
  onApplyCoupon: (code: string) => void;
  couponCode?: string;
  loading?: boolean;
}

const CartSummary: React.FC<CartSummaryProps> = ({
  subtotal,
  shipping,
  tax,
  discount,
  total,
  onCheckout,
  onApplyCoupon,
  couponCode,
  loading = false,
}) => {
  return (
    <Card style={styles.container}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
      </View>

      <View style={styles.pricingBreakdown}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Subtotal:</Text>
          <Text style={styles.pricingValue}>₹{subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Shipping:</Text>
          <Text style={styles.pricingValue}>
            {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Tax (18%):</Text>
          <Text style={styles.pricingValue}>₹{tax.toFixed(2)}</Text>
        </View>

        {discount > 0 && (
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>Discount:</Text>
            <Text style={styles.pricingValue}>-₹{discount.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </View>

      <View style={styles.couponSection}>
        <InputField
          placeholder="Enter coupon code"
          value={couponCode || ''}
          onChangeText={onApplyCoupon}
          rightIcon="tag"
          style={styles.couponInput}
        />
      </View>

      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total:</Text>
        <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={onCheckout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        )}
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  pricingBreakdown: {
    marginBottom: 20,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pricingLabel: {
    fontSize: 16,
    color: '#666',
  },
  pricingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  couponSection: {
    marginBottom: 20,
  },
  couponInput: {
    marginBottom: 12,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E53935',
  },
  checkoutButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CartSummary;
```

## 🎯 Navigation Components

### Tab Bar Icon
`src/components/navigation/TabBarIcon.tsx`

```typescript
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Color } from 'react-native-svg';

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: Color;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ name, focused, color, size }) => {
  return (
    <Icon
      name={name}
      size={size}
      color={color}
      style={{
        opacity: focused ? 1 : 0.7,
      transform: [{ scale: focused ? 1.1 : 1 }],
      tintColor: color,
      width: size,
        height: size,
      resizeMode: 'contain',
      backgroundColor: 'transparent',
      margin: 0,
      padding: 0,
        alignSelf: 'center',
      textAlign: 'center',
        textAlignVertical: 'center',
      alignContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    />
  );
};

export default TabBarIcon;
```

### Custom Drawer Content
`src/components/navigation/CustomDrawerContent.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { DrawerContentComponentProps, DrawerContentOptions } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { logout } from '../../services/authService';
import { clearCart } from '../../store/slices/cartSlice';

interface Props extends DrawerContentComponentProps {}

const CustomDrawerContent: React.FC<Props> = (props) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  const handleNavigation = (screen: string) => {
    navigation.closeDrawer();
    navigation.navigate(screen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(clearCart());
      navigation.closeDrawer();
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      onPress: () => handleNavigation('Home'),
    },
    {
      id: 'products',
      label: 'Products',
      icon: 'shopping-bag',
      onPress: () => handleNavigation('Products'),
    },
    {
      id: 'wishlist',
      label: 'Wishlist',
      icon: 'favorite-border',
      onPress: () => handleNavigation('Wishlist'),
    },
    {
      id: 'cart',
      label: 'Cart',
      icon: 'shopping-cart',
      onPress: () => handleNavigation('Cart'),
    },
    {
      id: 'orders',
      label: 'My Orders',
      icon: 'clipboard-list',
      onPress: () => handleNavigation('Orders'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'account-circle',
      onPress: () => handleNavigation('Profile'),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      onPress: () => handleNavigation('Settings'),
    },
  ];

  return (
    <ScrollView {...props} style={styles.container}>
      {/* User Header */}
      <View style={styles.userSection}>
        {user ? (
          <View style={styles.userInfo}>
            <Image
              source={{ uri: user.avatar || 'https://picsum.photos/seed/avatar' }}
              style={styles.avatar}
            />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Icon name="logout" size={20} color="#E53935" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.loginSection}>
            <Icon name="account-circle" size={40} color="#ccc" />
            <View style={styles.loginText}>
              <Text style={styles.loginTitle}>Welcome!</Text>
              <Text style={styles.loginSubtitle}>Sign in to continue</Text>
            </View>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleNavigation('Login')}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => handleNavigation('Register')}
            >
              <Text style={styles.loginButtonText}>Register</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Menu Items */}
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={item.onPress}
        >
          <Icon
            name={item.icon}
            size={20}
            color="#666"
            style={styles.menuIcon}
          />
          <Text style={styles.menuText}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#E53935',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  loginSection: {
    padding: 20,
    alignItems: 'center',
  },
  loginText: {
    alignItems: 'center',
    marginBottom: 10,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  loginButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIcon: {
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomDrawerContent;
```

## 🎨 Loading Components

### Loading Spinner
`src/components/loading/LoadingSpinner.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color,
  text,
}) => {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.primary;

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium'}
        color={spinnerColor}
      />
      {text && (
        <Text style={[styles.text, { color: spinnerColor }]}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
```

### Error Boundary
`src/components/loading/ErrorBoundary.tsx`

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface State {
  hasError: boolean;
  error?: Error;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#E53935" />
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => this.setState({ hasError: false, error: undefined })}
            >
              <Icon name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E53935',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default ErrorBoundary;
```

## 📱 Modals

### Alert Modal
`src/components/modals/AlertModal.tsx`

```typescript
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert-triangle';
      case 'error':
        return 'error';
      default:
        return 'info-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#4CAF50';
      case 'warning':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, styles.centered]}>
          <View style={styles.content}>
            <Icon
              name={getIconName()}
              size={48}
              color={getIconColor()}
              style={styles.icon}
            />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
            >
              <Text style={styles.buttonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.buttonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginTop: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  confirmButton: {
    backgroundColor: '#E53935',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AlertModal;
```

## 🎨 UI Elements

### Rating Stars
`src/components/ui/RatingStars.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface RatingStarsProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  readonly?: boolean;
  onRatingChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  size = 'medium',
  readonly = false,
  onRatingChange,
}) => {
  const [localRating, setLocalRating] = useState(rating);

  const starSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;
  const maxRating = 5;

  const handleStarPress = (starNumber: number) => {
    if (readonly) return;

    const newRating = starNumber === localRating ? 0 : starNumber;
    setLocalRating(newRating);
    onRatingChange?.(newRating);
  };

  const renderStar = (starNumber: number) => {
    const filled = starNumber <= localRating;
    return (
      <TouchableOpacity
        style={styles.starButton}
        onPress={() => handleStarPress(starNumber)}
        disabled={readonly}
      >
        <Icon
          name={filled ? 'star' : 'star-border'}
          size={starSize}
          color={filled ? '#FFD700' : '#ccc'}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {[...Array(maxRating)].map((_, index) => (
        <View key={index} style={styles.starContainer}>
          {renderStar(index + 1)}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginHorizontal: 2,
  },
  starButton: {
    padding: 4,
  },
  starSize: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default RatingStars;
```

### Loading Spinner (Minimal)
`src/components/ui/LoadingSpinner.tsx`

```typescript
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinnerMinimal: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#E53935',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={color}
        animating={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinnerMinimal;
```

---

## 📚 Usage

### Import Components
```typescript
import Button from '../components/common/Button';
import InputField from '../components/common/InputField';
import ProductCard from '../components/product/ProductCard';
import CartItem from '../components/cart/CartItem';
import AlertModal from '../components/modals/AlertModal';
```

### Props and State Management
- All components are written with TypeScript
- Reusable with customizable props
- Integrated with Redux store where needed
- Properly typed with interfaces
- Optimized for performance

### Customization
- Components accept style props for customization
- Theme integration support
- Responsive design considerations
- Accessibility features

---

*This component library provides a solid foundation for building the Myntra Clone mobile application with consistent, reusable UI components.*