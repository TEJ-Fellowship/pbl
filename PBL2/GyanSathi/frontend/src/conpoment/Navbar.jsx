import { Link } from 'react-router-dom'

const Navbar = () => {
    return(
        <nav>
            <Link to='/'>Home</Link>
            <Link to='/my-courses'>My Courses</Link>
        </nav>
    )
}

export default Navbar