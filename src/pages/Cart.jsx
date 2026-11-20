import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import '../styles/cart.css';

export default function Cart() {
  const { cart, updateQty, removeItem, clearCart, totalPrice } = useCart();

  const handleCheckout = () => {
    alert('Thank you for your order! 🍰');
    clearCart();
  };

  return (
    <>
      <div className="nav">
        <h1 style={{ color: '#80665C' }}>Dreamy Bites</h1>
        <Link to="/homepage" className="backHomeBtn">Home</Link>
      </div>

      <div className="cart-page">
        <h1>My Basket</h1>

        {cart.length === 0 ? (
          <>
            <p>Your basket is empty.</p>
            <Link to="/homepage#menu" className="cart-link">Browse the menu</Link>
          </>
        ) : (
          <>
            {cart.map((i) => (
              <div className="cart-item" key={i.foodId}>
                <img src={i.pic} alt={i.foodName} />
                <div className="cart-info">
                  <h2>{i.foodName}</h2>
                  <p>Php {i.price} each</p>
                </div>
                <div className="cart-qty">
                  <button onClick={() => updateQty(i.foodId, i.quantity - 1)}>-</button>
                  <span>{i.quantity}</span>
                  <button onClick={() => updateQty(i.foodId, i.quantity + 1)}>+</button>
                </div>
                <h3>Php {i.price * i.quantity}</h3>
                <button className="remove" onClick={() => removeItem(i.foodId)}>✕</button>
              </div>
            ))}

            <h2 className="cart-total">Total: Php {totalPrice}</h2>
            <button className="checkout" onClick={handleCheckout}>Checkout</button>
          </>
        )}
      </div>
    </>
  );
}