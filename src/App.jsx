import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './CartContext';
import './styles/App.css';
import FoodPage from './pages/FoodPage';
import HomePage from './pages/HomePage';
import Login from './pages/Log-in';
import Cart from './pages/Cart';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/homepage" element={<HomePage />} />
          <Route path="/foodpage/:item" element={<FoodPage />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;