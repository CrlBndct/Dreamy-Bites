import { useRef } from "react";

export let foodArray = [
  {
    pic: "/src/assets/ChocolateCake.jpg",
    foodId: 123,
    foodName: "Chocolate Cake",
    foodDes: "A cake that has a chocolate flavor in it",
    price: 400,
    category: "Pastry",
    quantity: 0,
    rating: 4.5,       // starting average
    ratingCount: 20
  }, 
  {
    pic: "/src/assets/Ensaymada.jpg",
    foodId: 456,
    foodName: "Ensaymada",
    foodDes: "A filipino bread with sugar and butter as its flavor",
    price: 25,
    category: "Pastry",
    quantity: 0, 
  }, 
  {
    pic: "/src/assets/Pandesal.jpg",
    foodId: 789,
    foodName: "Pandesal",
    foodDes: "A filipino popular breakfast, best when dipped in coffee",
    price: 5,
    category: "Pastry",
    quantity: 0, 
    rating: 4.5,       // starting average
    ratingCount: 20
  },
  {
    pic: "/src/assets/Coke.jpg",
    foodId: 101,
    foodName: "Coke",
    foodDes: "A very satisfying drink for your craves",
    price: 25,
    category: "Beverage",
    quantity: 0, 
    rating: 4.5,       // starting average
    ratingCount: 20
  },
  
];