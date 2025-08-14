const multer = require('multer');
const path = require('path');

//configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // specify the directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // create a unique filename
    },
});

//file filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']; // allowed file types

    // const extname = allowedTypes.test(file.mimetype) && allowedTypes.test(file.originalname.toLowerCase());
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // accept the file
    } else {
        cb(new Error('  only .jpeg, .jpg and .png formats are allowed!', false), false); // reject the file
    }
}

const upload = multer({
    //limits dida huncha yeah nw dida huncha hae
    storage: storage, fileFilter: fileFilter, limits: { fileSize: 1024 * 1024 * 5 } // limit file size to 5MB
});

module.exports = upload;