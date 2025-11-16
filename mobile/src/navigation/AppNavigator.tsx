import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ProductListScreen from '../screens/Products/ProductListScreen';
import ProductDetailScreen from '../screens/Products/ProductDetailScreen';
import VirtualTryOnScreen from '../screens/AI/VirtualTryOnScreen';
import CartScreen from '../screens/Cart/CartScreen';
import WishlistScreen from '../screens/Wishlist/WishlistScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import OrdersScreen from '../screens/Orders/OrdersScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';

// Import navigation components
import CustomDrawerContent from '../components/Navigation/CustomDrawerContent';
import TabBarIcon from '../components/Navigation/TabBarIcon';

// Stack Navigators
const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStackNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'fade',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
    <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => {
  const { cart } = useSelector((state: any) => state.cart);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => (
          <TabBarIcon
            routeName={route.name}
            focused={focused}
            color={color}
            size={size}
          />
        ),
        tabBarActiveTintColor: '#E53935',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={ProductListScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <TabBarIcon
              routeName="Home"
              focused={focused}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductListScreen}
        options={{
          tabBarLabel: 'Products',
        }}
      />
      <Tab.Screen
        name="VirtualTryOn"
        component={VirtualTryOnScreen}
        options={{
          tabBarLabel: 'Try On',
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          tabBarBadge: cart.items.length > 0 ? cart.items.length.toString() : undefined,
        }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          tabBarLabel: 'Wishlist',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Stack
const AppStackNavigator = () => (
  <AppStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <AppStack.Screen
      name="MainTabs"
      component={MainTabNavigator}
      options={{ headerShown: false }}
    />
    <AppStack.Screen
      name="ProductDetail"
      component={ProductDetailScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <AppStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <AppStack.Screen
      name="Orders"
      component={OrdersScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
    <AppStack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
    <AppStack.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        animation: 'slide_from_right',
      }}
    />
  </AppStack.Navigator>
);

// Admin Stack
const AdminStackNavigator = () => (
  <AdminStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <AdminStack.Screen
      name="AdminDashboard"
      component={AdminDashboardScreen}
      options={{
        title: 'Admin Dashboard',
      headerShown: true,
        headerStyle: {
          backgroundColor: '#E53935',
        },
        headerTintColor: '#fff',
      }}
    />
    <AdminStack.Screen
      name="AdminProducts"
      component={ProductListScreen}
      options={{
        title: 'Product Management',
        headerShown: true,
      }}
    />
    <AdminStack.Screen
      name="AdminOrders"
      component={OrdersScreen}
      options={{
        title: 'Order Management',
        headerShown: true,
      }}
    />
    <AdminStack.Screen
      name="AdminUsers"
      component={ProfileScreen}
      options={{
        title: 'User Management',
        headerShown: true,
      }}
    />
  </AdminStack.Navigator>
);

// Root Drawer Navigator
const RootDrawerNavigator = () => {
  const { user } = useSelector((state: any) => state.auth);

  return (
    <Drawer.Navigator
      screenOptions={{
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 300,
        },
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerContentOptions: {
          activeTintColor: '#E53935',
          inactiveTintColor: '#666',
          itemStyle: {
            marginVertical: 2,
          },
        },
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="MainApp"
        component={AppStackNavigator}
        options={{
          title: user?.name || 'Guest User',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#E53935',
          },
          headerTintColor: '#fff',
        }}
      />
      <Drawer.Screen
        name="AdminPanel"
        component={AdminStackNavigator}
        options={{
          title: 'Admin Panel',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#333',
          },
          headerTintColor: '#fff',
        }}
      />
    </Drawer.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const { isAuthenticated } = useSelector((state: any) => state.auth);

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <RootDrawerNavigator />
      ) : (
        <AuthStackNavigator />
      )}
    </NavigationContainer>
  );
};

// Theme configuration
const getActiveTheme = () => {
  // You can implement theme switching logic here
  return DefaultTheme;
};

export default AppNavigator;