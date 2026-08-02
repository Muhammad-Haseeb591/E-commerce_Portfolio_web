import React from 'react'
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom'
import New from '../pages/New.jsx'
import Sales from '../pages/Sale.jsx'
import Women from '../pages/Women.jsx'
import Men from '../pages/Men.jsx'
import Fragrances from '../pages/Fragrances.jsx'
import Kids from '../pages/Kids.jsx'
import Accessories from '../pages/Accessories.jsx'
import Getinspired from '../pages/GetInspired.jsx'
import Home from '../pages/Home.jsx'
import MainLayout from './MainLayout.jsx'
import NotFound from '../pages/NotFound.jsx'
import Detail_Page from '../assets/components/product/detail/DetailPage.jsx'
import Cart from '../assets/components/cart/Cart.jsx'
import Login from "../pages/auth/Login.jsx"
import Signup from "../pages/auth/Signup.jsx"
import AdminPanel from "../assets/components/admin/AdminPanel.jsx"
import Checkoutpage from "../pages/checkout/CheckoutPage.jsx"
import CartSync from "../assets/components/cart/Cartsync.jsx"
import Favourite from "../pages/Wishlist.jsx"
import Orders from "../assets/components/admin/orders/Orders.jsx"
import Products from "../assets/components/admin/products/Products.jsx"
import ProtectedAdminRoute from "../assets/components/admin/ProtectedAdminRoute.jsx"
import OAuthSuccess from "../pages/auth/OAuthSuccess.jsx"
import VerifyOtp from '../pages/auth/Verifyotp.jsx'
import Forgotpassword from "../pages/auth/Forgotpassword.jsx"
import Resetpassword from "../pages/auth/Resetpassword.jsx"
import Accountactivity from "../assets/components/product/Accountactivity.jsx"
import Dashboard from '../assets/components/admin/Dashboard.jsx'
import { Users } from 'lucide-react'

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'men', element: <Men /> },
      { path: 'kids', element: <Kids /> },
      { path: 'sales', element: <Sales /> },
      { path: 'accessories', element: <Accessories /> },
      { path: 'fragrances', element: <Fragrances /> },
      { path: 'getinspired', element: <Getinspired /> },
      { path: 'new', element: <New /> },
      { path: 'oauth-success', element: <OAuthSuccess /> },
      { path: 'women', element: <Women /> },
      { path: 'products/:id', element: <Detail_Page /> },
      { path: 'cart', element: <Cart /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },

      {
        path: 'admin',
        element: <ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute>,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'products', element: <Products /> },
          { path: 'orders', element: <Orders /> },
          {
            path: 'customers',
            element: (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-700">Customers</h3>
                <p className="text-sm text-gray-400 mt-1">Coming soon</p>
              </div>
            ),
          },
        ],
      },

      { path: 'checkout', element: <Checkoutpage /> },
      { path: 'favourite', element: <Favourite /> },

      { path: 'account', element: <Accountactivity /> },
      { path: 'account/:tab', element: <Accountactivity /> },

      { path: 'order', element: <Navigate to="/admin/orders" replace /> },
      { path: 'verify-otp', element: <VerifyOtp /> },
      { path: 'forgot-password', element: <Forgotpassword /> },
      { path: 'reset-password/:token', element: <Resetpassword /> },
      { path: '*', element: <NotFound /> },
    ]
  }
])

const AppRoutes = () => {
  return (
    <div>
      <CartSync />
      <RouterProvider router={router} />
    </div>
  )
}

export default AppRoutes