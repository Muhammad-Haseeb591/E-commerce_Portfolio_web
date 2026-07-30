import React from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
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
import Detail_Page from '../assets/components/product/DetailPage.jsx'
import Cart from '../assets/components/cart/Cart.jsx'
import Login from "../pages/auth/Login.jsx"
import Signup from "../pages/auth/Signup.jsx"
import AdminPanel  from "../assets/components/admin/AdminPanel.jsx"
import Checkoutpage from "../pages/checkout/CheckoutPage.jsx"
import CartSync from "../assets/components/cart/Cartsync.jsx" 
import Favourite from "../pages/Wishlist.jsx"
import Orders from "../assets/components/admin/orders/Orders.jsx"
import ProtectedAdminRoute from "../assets/components/admin/ProtectedAdminRoute.jsx"
import OAuthSuccess from "../pages/auth/OAuthSuccess.jsx"
import VerifyOtp from '../pages/auth/Verifyotp.jsx'
import Forgotpassword from "../pages/auth/Forgotpassword.jsx"
import Resetpassword from "../pages/auth/Resetpassword.jsx"
import Accountactivity from "../assets/components/product/Accountactivity.jsx"
import SalesReportPage from '../assets/components/admin/Dashboard.jsx'

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
      { path: 'admin/dashboard', element: <ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute> },
      { path: 'admin/reports', element: <ProtectedAdminRoute><SalesReportPage /></ProtectedAdminRoute> }, // 👈 naya route
      { path: 'checkout', element: <Checkoutpage/> },
      { path: 'favourite', element: <Favourite/> },

      { path: 'account', element: <Accountactivity /> },
      { path: 'account/:tab', element: <Accountactivity /> },

      { path: 'order', element: <ProtectedAdminRoute><Orders/></ProtectedAdminRoute> },
      { path: 'verify-otp', element: <VerifyOtp /> },
      { path: 'forgot-password', element: <Forgotpassword/> },
      { path: 'reset-password/:token', element: <Resetpassword/> },
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