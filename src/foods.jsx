import ChocolateCake from "./assets/ChocolateCake.jpg";
import Ensaymada from "./assets/Ensaymada.jpg";
import Pandesal from "./assets/Pandesal.jpg";
import Coke from "./assets/Coke.jpg";

export let foodArray = [
  {
    pic: ChocolateCake,
    foodId: 123,
    foodName: "Chocolate Cake",
    foodDes: "A cake that has a chocolate flavor in it",
    price: 400,
    category: "Pastry",
    rating: 4.5,
    ratingCount: 20,
    available: true
  },
  {
    pic: Ensaymada,
    foodId: 456,
    foodName: "Ensaymada",
    foodDes: "A filipino bread with sugar and butter as its flavor",
    price: 25,
    category: "Pastry",
    rating: 4.2,
    ratingCount: 35,
    available: true
  },
  {
    pic: Pandesal,
    foodId: 789,
    foodName: "Pandesal",
    foodDes: "A filipino popular breakfast, best when dipped in coffee",
    price: 5,
    category: "Pastry",
    rating: 4.8,
    ratingCount: 50,
    available: true
  },
  {
    pic: Coke,
    foodId: 101,
    foodName: "Coke",
    foodDes: "A very satisfying drink for your craves",
    price: 25,
    category: "Beverage",
    rating: 4.0,
    ratingCount: 15,
    available: true
  }
];