import { Outlet, useLocation, matchPath } from "react-router-dom";

import Header from "../assets/components/e-Components/Header";
import PromoMessage from "../assets/components/e-Components/PromoMessage";
import FooterNav from "../assets/components/e-Components/FooterNav";
import Footer from "../assets/components/e-Components/Footer";
import Main from "../assets/components/e-Components/Main";


const MainLayout = () => {
  const { pathname } = useLocation();

  const minimalLayoutPaths = [
    "/checkout",
    "/signup",
    "/login",
    "/forgot-password",
    "/verify-otp",
    "/reset-password/:token",
    "/account/orders",
    "/account/reviews"
  ];

  const isMinimalLayout =
    minimalLayoutPaths.some((path) => matchPath(path, pathname)) ||
    pathname.startsWith("/admin");

  const hideMain =
    pathname === "/" ||
    pathname === "/cart" ||
    pathname === "/favourites" ||
    pathname.startsWith("/products/") ||
    isMinimalLayout;

  if (isMinimalLayout) {
    return <Outlet key={pathname} />;
  }

  return (
    <>
      <Header />
      <PromoMessage />
      {hideMain ? (
        <Outlet key={pathname} />
      ) : (
        <Main>
          <Outlet key={pathname} />
        </Main>
      )}
      <FooterNav />
      <Footer />
    </>
  );
};

export default MainLayout;