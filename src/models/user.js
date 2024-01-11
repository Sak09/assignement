const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt=require("jsonwebtoken");
const userSchema= new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true
    },
    password:{
        type:String,
        required:true,
        max:8
    },
    confirm_password:{
        type:String,
        required:true 
    },
    
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
})
userSchema.methods.generateAuthToken = async function(){
    try{
        console.log(this._id);
        const token = jwt.sign({_id:this._id.toString()},process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token})
        await this.save();
        return token;
    }catch(error){
        res.send("the error part"+error);
        console.log("the error part"+error);
    }
}
const User = new mongoose.model("User" ,userSchema);
module.exports = User;


