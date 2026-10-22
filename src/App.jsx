import './App.css'

function App() {

function Mybutton(props){
  const buttonStyle ={
    backgroundColor: "lightpink",
    borderRadius: 20,
    borderColor: "lightpink"
  };

  return(
    <>
      <button style={buttonStyle} className={props.class}>{props.name}</button>
    </>
  );
}


  return (
    <>
      <div className="nav-bar"> 
        <ul> 
          <li>Home</li>
          <li>Menu</li>
          <li>About</li>
        </ul>
      </div>

      <div className="intro-sec"> 
        <div className="text">
          <h3>welcome to our table and</h3>
          <h1 className="tagline">Taste the Passion Behind Every Creation</h1>
          <h3>Craving something extraordinary? Discover your favorite flavors, explore our menu, and let every bite bring a little more happiness to your day.</h3>
        </div>

        <Mybutton name = "See Our Menu" class = "btn1"/>
      </div>
    </>
  )
}

export default App
