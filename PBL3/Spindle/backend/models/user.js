import mongoose from "mongoose";
const userSchema = new mongoose.Schema(
    {
        fullname:{
            type:String,
            required:true,
            min:3,
            max:20
        },
        username:{
            type:String,
            required:true,
            min:3,      
            max:20,
            unique:true
        },
        email:{
            type:String,
            required:true,
            max:40,
            unique:true,
            match : [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,"Invalid email address"],
        },
        password:{
            type:String,
            required:true,
            min:6
        },
        createdAt:{
            type:Date,
            default:Date.now,
        },

        polls:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Poll"
            }
        ]


    }
    )
    const User = mongoose.models.User || mongoose.model("User",userSchema);
    export default User;
