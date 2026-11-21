import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './AuthContext';
import { BranchesProvider } from './BranchesContext';
import { ProductsProvider } from './ProductsContext';
import { OrdersProvider } from './OrdersContext';
import { CartProvider } from './CartContext';
import ProtectedRoute from './ProtectedRoute';

import './styles/App.css';

import Login from './pages/Log-in';
import HomePage from './pages/HomePage';
import FoodPage from './pages/FoodPage';
import Cart from './pages/Cart';
import BakerPage from './pages/BakerPage';
import BranchesPage from './pages/BranchesPage';

function App() {
  return (
    <AuthProvider>
      <BranchesProvider>
        <ProductsProvider>
          <OrdersProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Login />} />

                  <Route
                    path="/homepage"
                    element={<ProtectedRoute><HomePage /></ProtectedRoute>}
                  />
                  <Route
                    path="/foodpage/:item"
                    element={<ProtectedRoute><FoodPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/cart"
                    element={<ProtectedRoute><Cart /></ProtectedRoute>}
                  />
                  <Route
                    path="/branches"
                    element={<ProtectedRoute><BranchesPage /></ProtectedRoute>}
                  />
                  <Route
                    path="/baker"
                    element={<ProtectedRoute role="baker"><BakerPage /></ProtectedRoute>}
                  />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </OrdersProvider>
        </ProductsProvider>
      </BranchesProvider>
    </AuthProvider>
  );
}

export default App;