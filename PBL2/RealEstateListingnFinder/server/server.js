
import express from 'express'
import  cors from 'cors'
import connectDB from './config/db.js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve("../.env") }); // <-- point to parent folder);

import propertyRoutes from './routes/propertyRoutes.js'


const app = express();

app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));
app.use(express.json())
app.use('/uploads', express.static("uploads"))


const PORT = process.env.PORT || 5001;


connectDB(process.env.MONGODB_URL).then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    }
    )
})

app.use('/api/properties', propertyRoutes)