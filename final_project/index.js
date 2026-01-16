const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session')
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

let users = []

//check if a user with the given username exist already
const doesExist = (username)=>{
//filter the users array for any user with the same username
    let userswitchsamename = users.filter((user) => {
        return user.username === username;
    });
    // Return true if any user with the same username is found, otherwise return false
    if (userswitchsamename.lenght > 0){
        return true;
    }else{
        return false;
    }
}

//check if a user with the given username and password exist
const authenticatedUser = (username, password) => {
//filter the users array for any user with the same username and password
    let validusers = users.filter((user) => {
        return (user.username === username && user.password === password);
    });
    // Return true if any valid user is found, otherwise return false
    if (validusers .lenght > 0){
        return true;
    }else{
        return false;
    }
}

const app = express();

app.use(express.json());

app.use("/customer",session({secret:"fingerprint_customer",resave: true, saveUninitialized: true}))

app.use("/customer/auth/*", function auth(req,res,next){
//Write the authenication mechanism here
    //check if user is logged and has valid acces token
    if(req.session.authorization){
        let token = req.session.authorization['accessToken']

        //verify JWT token
        jwt.verify(token, "access", (err, user) => {
            if(!err){
                req.user = user;
                next(); // Proceed to next middleware
            }else{
                return res.status(403).json({message: "User not authenticad"});
            }
        });
    }else{
        return res.status(403).json({message: "User not logged in"});
    }
});
 
// login endpoint
app.post("/login", (req, res)=> {
    const username = req.body.username;
    const password = req.body.password;

    //check if udername or password is missing
    if(!username || !password){
        return res.status(404).json({message: "Error loggin in" });
    }

    //Authenticate user
    if(authenticatedUser(username, password)){
        let accessToken = jwt.sign({
            data: password
        }, 'acces', {expiresIn: 60 * 60});
        
        //Store access token and username in session
        req.session.authorization = {
            accessToken, username
        }
        return res.status(202).json({message: "User succefully logged in" });
    }else{
        return res.status(208).json({message: "Invalid Login. Check the username and password" });
    }
});

//Register a new user 
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password; 

    //check if both provided (username and passowrd)
    if(username && password){
        //check if the user doesn't exist already
        if(!doesExist(username)){
            //Add the new user to the users array
            users.push({"username": username, "password": password});
            return res.status(200).json({message: "User succefully registered. Now you can login" });
        }else{
            return res.status(404).json({message: "User already exists!"});
        }
    }
    // Return error if username or password is missing
    return res.status(404).json({message: "Unable to register user." });
});

const PORT =5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT,()=>console.log("Server is running"));
