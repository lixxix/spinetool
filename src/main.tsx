import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from 'react-router-dom';
import App from "./App";
import AppProvider from "./app_provider";
import GlobalProgress from "./components/global-progress";
import { store } from "./store";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <BrowserRouter>
      <Provider store={store}>
        <Suspense fallback={<h1>loading</h1>}>
          <AppProvider>   
            <App />
          </AppProvider>
          <Toaster position="top-center" richColors />
          <GlobalProgress></GlobalProgress>
        </Suspense>
      </Provider>
    </BrowserRouter>
);
