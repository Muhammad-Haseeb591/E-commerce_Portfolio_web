import { useEffect } from "react";
import { useDispatch } from "react-redux";
import ReactRouter from "./routes/ReactRouter.jsx";
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
    <ReactRouter />
  </HelmetProvider>
    </>
  );
};

export default App;