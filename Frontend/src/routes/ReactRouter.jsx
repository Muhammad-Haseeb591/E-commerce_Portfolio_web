import React from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import New from '../files/New.jsx'
import Sales from '../files/Sales.jsx'
import Women from '../files/Women.jsx'
import Men from '../files/Men.jsx'
import Fragrances from '../files/Fragrances.jsx'
import Kids from '../files/Kids.jsx'
import Accessories from '../files/Accessories.jsx'
import Getinspired from '../files/Getinspired.jsx'
import Home from '../files/Home.jsx'
import OrderSuccess from '../files/OrderSuccess.jsx'  
import MainLayout from '../Layouts/MainLayout.jsx'
import NotFound from '../files/NotFound.jsx'
import Detail_Page from '../assets/components/Detail_Page/Detail_Page.jsx'
import Cart from '../assets//components/Detail_Page/Cart.jsx'
import Login from "../files/Login.jsx"
import Signup from "../files/Signup.jsx"
import AdminPanel  from "../assets/components/AdminPanelComponents/AdminPanel.jsx"
import Checkoutpage from "../files/Checkoutpage.jsx"
import CartSync from "../assets/components/Detail_Page/Cartsync.jsx" 
import Favourite from "../files/Favourite.jsx"
import Orders from "../assets/components/AdminPanelComponents/Orders.jsx"
import ProtectedAdminRoute from "../assets/components/AdminPanelComponents/ProtectedAdminRoute.jsx"
import OAuthSuccess from "../files/OAuthSuccess.jsx"
import VerifyOtp from '../files/Verifyotp.jsx'
import Forgotpassword from "../files/Forgotpassword"
import Resetpassword from "../files/Resetpassword"
import Accountactivity from "../assets/components/e-Components/Accountactivity.jsx"

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
      { path: 'checkout', element: <Checkoutpage/> },
      { path: 'favourite', element: <Favourite/> },

      // 👇 account routes — single dynamic route handles both /account/orders and /account/reviews
      { path: 'account', element: <Accountactivity /> },
      { path: 'account/:tab', element: <Accountactivity /> },

      { path: 'order', element: <ProtectedAdminRoute><Orders/></ProtectedAdminRoute> },
      { path: 'order-success', element: <OrderSuccess/> },
      { path: 'verify-otp', element: <VerifyOtp /> },
      { path: 'forgot-password', element: <Forgotpassword/> },
      { path: 'reset-password/:token', element: <Resetpassword/> },
      { path: '*', element: <NotFound /> },
    ]
  }
])

const ReactRouter = () => {
  return (
    <div>
      <CartSync />
      <RouterProvider router={router} />
    </div>
  )
}

export default ReactRouter