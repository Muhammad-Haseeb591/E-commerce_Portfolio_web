import { useEffect } from "react";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes//AppRoutes";
import { checkAuth } from "./assets/components/store/authSlice";
import { HelmetProvider } from 'react-helmet-async'

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
       <HelmetProvider>
    <AppRoutes />
  </HelmetProvider>
    </>
  );
};

export default App;