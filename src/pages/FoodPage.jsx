
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProducts } from '../ProductsContext';
import { useCart } from '../CartContext';
import StarRating from '../StarRating';
import { useRatings } from '../useRatings';
import { imageUrl } from '../imageUrl';
import '../styles/foodpage.css';

export default function FoodPage() {
  const { item } = useParams();
  const navigate = useNavigate();

  const { addToCart, totalItems } = useCart();
  const { products, loading } = useProducts();
  const { ratings, rate, loading: ratingsLoading } = useRatings();

  const [qty, setQty] = useState(1);

  const food = products.find((f) => f.foodId === Number(item));

  const myRating = food ? ratings[food.foodId] || 0 : 0;
  const votes = food?.ratingCount || 0;
  const average = food?.rating || 0;

  const handleAdd = () => {
    if (!food || food.available === false || qty < 1) return;

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

      {loading ? (
        <h2 style={{ textAlign: 'center', paddingTop: '20vh' }}>
          Loading...
        </h2>
      ) : !food ? (
        <h2 style={{ textAlign: 'center', paddingTop: '20vh' }}>
          Item not found.
        </h2>
      ) : (
        <div className="container">
          <img
            src={imageUrl(food.pic)}
            alt={food.foodName}
            className="foodImg"
          />

          <div className="details">
            <h1 className="proName">{food.foodName}</h1>
            <h2 className="desc">{food.foodDes}</h2>

            <div className="rating-box">
              <StarRating value={Math.round(average)} readOnly />
              <span className="rating-text">
                {average.toFixed(1)} ({votes} ratings)
              </span>
            </div>

            <div className="my-rating">
              <span>
                {ratingsLoading
                  ? 'Loading your rating...'
                  : myRating
                    ? 'Your rating:'
                    : 'Rate this item:'}
              </span>

              {!ratingsLoading && (
                <StarRating
                  value={myRating}
                  onChange={(stars) => rate(food.foodId, stars)}
                />
              )}
            </div>

            <div className="buy-row">
              <span className="pricing">
                Php {food.price * qty}
              </span>

              <div className="qty-box">
                <button
                  className="subtract"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  -
                </button>

                <span className="quantity">{qty}</span>

                <button
                  className="add"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                >
                  +
                </button>
              </div>

              <button
                className="addToCart"
                onClick={handleAdd}
                disabled={food.available === false}
              >
                {food.available === false
                  ? 'Sold out'
                  : 'Add To My Basket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
