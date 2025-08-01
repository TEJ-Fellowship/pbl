import './Navbar.css';

const Navbar = () => {
  return (
    <>
    <nav className="Nav-bar">
    <span className="Culinary-Campanion"> 
      Culinary Campanion
      </span>
      <div className="part1">
        <span id="home">Home</span>
        <span id="Explore">Explore</span>
        <span id="MyRecipies">MyRecipies</span>
      </div>
      <div>
       <span id="Search">
        <input placeholder='🔍Search'></input>
       </span>
       <span id="bookmark">Favourites</span>
       <span id="Avatar"></span>
      </div>
    </nav>
    </>
  )
}

export default Navbar

