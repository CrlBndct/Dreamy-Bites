
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../ProductsContext';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { imageUrl } from '../imageUrl';
import '../styles/App.css';

function Mybutton({ name, className, func }) {
  const buttonStyle = {
    backgroundColor: 'lightpink',
    borderRadius: 40,
    borderColor: 'lightpink',
    color: '#FFF4DE',
    fontSize: 20,
  };

  return (
    <button
      type="button"
      style={buttonStyle}
      className={className}
      onClick={func}
    >
      {name}
    </button>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const scrollTo = useRef(null);

  const scrollToMenu = () => {
    scrollTo.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const { totalItems } = useCart();
  const { products, loading, error } = useProducts();
  const { user, logout } = useAuth();

  const filters = ['All', 'Pastry', 'Beverage'];
  const [category, setCategory] = useState('All');

  const filterItems = products.filter(
    (food) =>
      food.available !== false &&
      (category === 'All' || food.category === category)
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="nav-bar">
        <span className="logo-name">Dreamy</span>
        <span className="logo-name2">Bites</span>

        <ul>
          <li><a href="#intro-sec">Home</a></li>
          <li><a href="#menu">Menu</a></li>
          <li><a href="#about">About</a></li>
        </ul>

        <div className="nav-right">
          {user?.role === 'baker' && <Link to="/baker">Dashboard</Link>}
          <Link to="/branches">Branches</Link>
          <Link to="/cart">Basket ({totalItems})</Link>
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </div>

      <div className="intro-sec" id="intro-sec">
        <div className="text">
          <h3>welcome to our table and</h3>

          <h1 className="tagline">
            Taste the Passion Behind Every Creation
          </h1>

          <h3>
            Craving something extraordinary? Discover your favorite flavors,
            explore our menu, and let every bite bring a little more happiness
            to your day.
          </h3>
        </div>

        <Mybutton
          name="See Our Menu"
          className="btn1"
          func={scrollToMenu}
        />
      </div>

      <div className="menu" ref={scrollTo} id="menu">
        <h1>Our Menu</h1>

        <ul className="filter">
          {filters.map((cat) => (
            <li className="categ" key={cat}>
              <button
                type="button"
                className="catBtn"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>

        {loading ? (
          <p>Loading products...</p>
        ) : error ? (
          <p>{error}</p>
        ) : filterItems.length === 0 ? (
          <p>No products available in this category.</p>
        ) : (
          filterItems.map((foodItem) => (
            <div className="item" key={foodItem.foodId}>
              <img
                src={imageUrl(foodItem.pic)}
                alt={foodItem.foodName}
              />

              <h1>{foodItem.foodName}</h1>

              <h3>{foodItem.foodDes}</h3>

              <h2>Php {foodItem.price}</h2>

              <Link
                to={`/foodpage/${foodItem.foodId}`}
                className="view"
              >
                View
              </Link>
            </div>
          ))
        )}
      </div>

      <div
        id="about"
        style={{ padding: '60px 20px', textAlign: 'center' }}
      >
        <h1>About Us</h1>

        <p>
          Dreamy Bites is a small bakery serving freshly baked Filipino
          favorites and sweet treats made with love.
        </p>
      </div>
    </>
  );
}
