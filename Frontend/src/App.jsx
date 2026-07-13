import { useEffect } from "react";
import { useDispatch } from "react-redux";
import ReactRouter from "./routes/ReactRouter.jsx";
import { checkAuth } from "./assets/components/redux_Toolkit/authSlice";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <ReactRouter />
    </>
  );
};

export default App;