import { useRef, useState } from 'react';
import {BrowserRouter, Routes, Route, Link, useParams} from 'react-router-dom';
import {foodArray} from '.\\foods';
import '.\\styles\\App.css';
import FoodPage from '.\\pages\\FoodPage';

function HomePage(){

  const scrollTo = useRef(null);
  const scrollToMenu = () => {
    scrollTo.current.scrollIntoView({behavior: "smooth"});
  }

  const filters = ["All", "Pastry", "Beverage"];
  let [category, setCategory] = useState("All");
  let filterItems = foodArray.filter((food) =>{ if(category == "All"){return true;} return food.category == category; });

  /* ======================================== */

  function Mybutton(props){
    const buttonStyle ={
      backgroundColor: "lightpink",
      borderRadius: 40,
      borderColor: "lightpink",
      color: "#FFF4DE",
      fontSize: 20
    };

    return(
      <>
        <button style={buttonStyle} className={props.class} onClick={props.func}>{props.name}</button>
      </>
    );
  }

    return(
        <>
          <div className="nav-bar"> 
            <span className='logo-name'>Dreamy</span><span className='logo-name2'>Bites</span>

            <ul> 
              <li><a href='#intro-sec'>Home</a></li>
              <li><a href='#menu'>Menu</a></li>
              <li><a href=''>About</a></li>
            </ul>

            <Link to = "/cart" className='cart'>Basket</Link>
          </div>

          <div className="intro-sec" id='intro-sec'> 
            <div className="text">
              <h3>welcome to our table and</h3>
              <h1 className="tagline">Taste the Passion Behind Every Creation</h1>
              <h3>Craving something extraordinary? Discover your favorite flavors, explore our menu, and let every bite bring a little more happiness to your day.</h3>
            </div>
            <Mybutton name = "See Our Menu" class = "btn1" func = {scrollToMenu}/>
          </div>

          <div className="menu" ref = {scrollTo} id='menu'>
            <h1>Our Menu</h1>
            <ul className='filter'> 
              {filters.map((cat) => <li className='categ'><button className='catBtn' onClick={() => setCategory(cat)}>{cat}</button></li> )}
            </ul>
            {filterItems.map((foodItem) =>
                <div className = "item" key = {foodItem.foodId}>
                  <img src = {foodItem.pic} alt = "Food Image"/>
                  <h1>{foodItem.foodName}</h1>
                  <h3>{foodItem.foodDes}</h3>
                  <h2>Php {foodItem.price}</h2>
                  <Link to = {`/foodpage/${foodItem.foodId}`} className='view'>View</Link>
                </div>
              )
            }
          </div>
        </>
    );
}

function App() {
  return (
      <BrowserRouter>
        <Routes> 
          <Route path = "/" element={<HomePage />} />
          <Route path = "/foodpage/:item" element = {<FoodPage />}/>
        </Routes>
      </BrowserRouter>
  )
}

export default App
