import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { foodArray } from '../foods';
import { useCart } from '../CartContext';
import StarRating from '../StarRating';
import { useRatings } from '../useRatings';
import '../styles/foodpage.css';

export default function FoodPage() {
  const { item } = useParams();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const [qty, setQty] = useState(1);
  const { ratings, rate } = useRatings();

  const food = foodArray.find((f) => f.foodId === Number(item));
  const myRating = food ? ratings[food.foodId] || 0 : 0;
  const average = food
    ? (food.rating * food.ratingCount + myRating) / (food.ratingCount + (myRating ? 1 : 0))
    : 0;
  const votes = food ? food.ratingCount + (myRating ? 1 : 0) : 0;

  const handleAdd = () => {
    addToCart(food, qty);
    navigate('/cart');
  };

  return (
    <>
      <div className="nav">
        <h1 style={{ color: '#80665C' }}>Dreamy Bites</h1>
        <Link to="/homepage" className="backHomeBtn">Home</Link>
        <Link to="/cart" className="cart">Basket ({totalItems})</Link>
      </div>

      {!food ? (
        <h2 style={{ textAlign: 'center' }}>Item not found.</h2>
      ) : (
        <div className="container">
          <img src={food.pic} alt={food.foodName} className="foodImg" />
          <h1 className="proName">{food.foodName}</h1>
          <h2 className="desc">{food.foodDes}</h2>
          <div className="rating-box">
            <StarRating value={Math.round(average)} readOnly />
            <span className="rating-text">{average.toFixed(1)} ({votes} ratings)</span>
          </div>

          <div className="my-rating">
            <span>{myRating ? 'Your rating:' : 'Rate this item:'}</span>
            <StarRating value={myRating} onChange={(stars) => rate(food.foodId, stars)} />
          </div>

          <button className="subtract" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
          <span className="quantity">{qty}</span>
          <button className="add" onClick={() => setQty((q) => q + 1)}>+</button>

          <button className="addToCart" onClick={handleAdd}>Add To My Basket</button>
          <span className="pricing">Php {food.price * qty}</span>
        </div>
      )}
    </>
  );
}