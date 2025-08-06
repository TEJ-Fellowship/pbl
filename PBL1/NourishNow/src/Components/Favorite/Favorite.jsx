import { useState } from 'react';
import './Favorite.css';

const recipesAll = [
    {
        id: 1,
        title: "Spaghetti Bolognese",
        ingredients: [
            "200g spaghetti",
            "100g minced beef",
            "1 onion",
            "2 garlic cloves",
            "400g canned tomatoes",
            "Salt",
            "Pepper",
            "Olive oil"
        ],
        instructions: "Cook spaghetti. Sauté onion and garlic, add beef. Add tomatoes, simmer 20 mins. Mix with spaghetti.",
        prepTime: 10,
        cookTime: 25,
        servings: 2,
        category: "Pasta",
        imageUrl: "https://example.com/spaghetti.jpg"
    },
    {
        id: 2,
        title: "Chicken Caesar Salad",
        ingredients: [
            "2 chicken breasts",
            "Romaine lettuce",
            "Croutons",
            "Parmesan cheese",
            "Caesar dressing"
        ],
        instructions: "Grill chicken. Toss lettuce, croutons, and cheese with dressing. Top with sliced chicken.",
        prepTime: 15,
        cookTime: 10,
        servings: 2,
        category: "Salad",
        imageUrl: "https://example.com/caesar.jpg"
    },
    {
        id: 3,
        title: "Vegetable Stir Fry",
        ingredients: [
            "1 bell pepper",
            "1 zucchini",
            "1 carrot",
            "Soy sauce",
            "Garlic",
            "Ginger",
            "Olive oil"
        ],
        instructions: "Chop vegetables. Stir fry with garlic and ginger. Add soy sauce. Cook until tender.",
        prepTime: 10,
        cookTime: 10,
        servings: 2,
        category: "Vegetarian",
        imageUrl: "https://example.com/stirfry.jpg"
    },
    {
        id: 4,
        title: "Pancakes",
        ingredients: [
            "1 cup flour",
            "1 egg",
            "1 cup milk",
            "1 tbsp sugar",
            "1 tsp baking powder",
            "Butter"
        ],
        instructions: "Mix ingredients. Heat pan with butter. Pour batter, cook until golden on both sides.",
        prepTime: 5,
        cookTime: 10,
        servings: 4,
        category: "Breakfast",
        imageUrl: "https://example.com/pancakes.jpg"
    },
    {
        id: 5,
        title: "Grilled Cheese Sandwich",
        ingredients: [
            "2 slices of bread",
            "2 slices of cheese",
            "Butter"
        ],
        instructions: "Butter bread. Place cheese between slices. Grill until golden and cheese melts.",
        prepTime: 5,
        cookTime: 5,
        servings: 1,
        category: "Snack",
        imageUrl: "https://example.com/grilledcheese.jpg"
    },
    {
        id: 6,
        title: "Beef Tacos",
        ingredients: [
            "Ground beef",
            "Taco shells",
            "Lettuce",
            "Tomato",
            "Cheddar cheese",
            "Taco seasoning"
        ],
        instructions: "Cook beef with seasoning. Fill tacos with beef, lettuce, tomato, and cheese.",
        prepTime: 10,
        cookTime: 15,
        servings: 3,
        category: "Mexican",
        imageUrl: "https://example.com/tacos.jpg"
    },
    {
        id: 7,
        title: "Tomato Soup",
        ingredients: [
            "400g canned tomatoes",
            "1 onion",
            "2 garlic cloves",
            "1 cup vegetable broth",
            "Salt",
            "Pepper",
            "Basil"
        ],
        instructions: "Sauté onion and garlic. Add tomatoes and broth. Simmer, blend, and season to taste.",
        prepTime: 10,
        cookTime: 20,
        servings: 2,
        category: "Soup",
        imageUrl: "https://example.com/tomatosoup.jpg"
    },
    {
        id: 8,
        title: "French Toast",
        ingredients: [
            "2 eggs",
            "1/2 cup milk",
            "4 slices bread",
            "Butter",
            "Cinnamon",
            "Sugar"
        ],
        instructions: "Whisk eggs and milk. Dip bread. Cook on buttered pan until golden.",
        prepTime: 5,
        cookTime: 10,
        servings: 2,
        category: "Breakfast",
        imageUrl: "https://example.com/frenchtoast.jpg"
    },
    {
        id: 9,
        title: "Veggie Omelette",
        ingredients: [
            "2 eggs",
            "Bell pepper",
            "Onion",
            "Spinach",
            "Salt",
            "Pepper",
            "Olive oil"
        ],
        instructions: "Sauté vegetables. Beat eggs. Pour eggs over veggies and cook until set.",
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        category: "Breakfast",
        imageUrl: "https://example.com/omelette.jpg"
    },
    {
        id: 10,
        title: "Banana Smoothie",
        ingredients: [
            "1 banana",
            "1 cup milk",
            "1 tbsp honey",
            "Ice cubes"
        ],
        instructions: "Blend all ingredients until smooth.",
        prepTime: 3,
        cookTime: 0,
        servings: 1,
        category: "Drink",
        imageUrl: "https://example.com/smoothie.jpg"
    }
];


function Favorite() {
    const [recipes, setRecipes] = useState([...recipesAll]);

    function handleEdit() {
        
    }

    function handleDelete(id) {
        const filterRecipe = recipes.filter(recipe => {
            if (recipe.id !== id) {
                return true;
            }
        })

        setRecipes(filterRecipe);
    }

    return (
        <ul>
            {recipes.map(recipe => {
                return (
                    <li key={recipe.id}>
                        <div className='each-recipe'>
                            <h3>{recipe.title}</h3>
                            <span>{recipe.category}  | preparation-time: {recipe.prepTime}</span>
                        </div>
                        <div className='buttons'><button onClick = {handleEdit}>Edit</button> <button onClick = {el=>handleDelete(recipe.id)}>Delete</button></div>
                    </li>)
            })}
        </ul>
    )
}

export default Favorite;