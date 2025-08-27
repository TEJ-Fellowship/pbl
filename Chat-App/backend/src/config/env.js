import dotenv from 'dotenv'
//you must think like it's from env ok  and yo tw server.js file mw garda ni hunthyo  but it's new thing 
dotenv.config();

export const ENV = { 
    PORT: process.env.PORT || 5001,
    MONGO_URI: process.env.MONGO_URI || random_mongo_uri,
    NODE_ENV: process.env.NODE_ENV || 'development',

}