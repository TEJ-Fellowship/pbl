import './Category.css'

function Category (props) {
        return (
            <div id="each-category">
                <div id={props.id}></div>
                <h5>{props.name}</h5>
            </div>
        )
    }

export default Category;