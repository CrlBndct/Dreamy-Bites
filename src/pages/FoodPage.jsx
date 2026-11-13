import { BrowserRouter, Routes, Route, Link, useParams } from "react-router-dom";
import { foodArray } from "..\\foods";
import "..\\styles\\foodpage.css"

export default function FoodPage(){
    let {item} = useParams();

    let findItems = foodArray.filter((food) => food.foodId == item);
    return(
        <>
            <div className="nav">
                <h1 style={{color: "#80665C"}}>Dreamy Bites</h1>
                <Link to = "/#menu" className="backHomeBtn">Home</Link>
                <Link to = "/cart" className="cart">Basket</Link>
            </div>
            
            {findItems.map((item) =><div className="container" key = {item.foodId}> 
                <img src = {item.pic} alt="image" className="foodImg"/>
                <h1 className="proName">{item.foodName}</h1>
                <h2 className="desc">{item.foodDes}</h2>
                <button className="addToCart">Add To My Basket</button>
                <span className="pricing">Php {item.price}</span>
            </div>)}
        </>
    );
}