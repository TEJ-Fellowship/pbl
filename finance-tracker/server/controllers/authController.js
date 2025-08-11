const User = require("../models/User");
const jwt = require("jsonwebtoken");

// generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// register user
exports.registerUser = async (req, res) => {
    const { fullName, email, password, profileImageUrl } = req.body;
    console.log("Received profileImageUrl in registerUser:", profileImageUrl);

    if(!fullName || !email || !password){
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    try {
        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "Email already in use"
            });
        }

        const user = await User.create({
            fullName,
            email,
            password,
            profileImageUrl
        });
        res.status(201).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error registering user"
        });
    }
}
    
// login user
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password){
        return res.status(400).json({
            success: false,
            message: "Please fill all fields"
        });
    }

    try {
        const user = await User.findOne({ email });

        if(!user || !(await user.matchPassword(password))){
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        res.status(200).json({
            id: user._id,
            user,
            token: generateToken(user._id)
        });
    } catch (error) {   
        res.status(500).json({
            success: false,
            message: "Error logging in"
        });
    }
}

// get user info
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            id: user._id,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error getting user info"
        });
    }
}

