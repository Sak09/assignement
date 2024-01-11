require('dotenv').config();
const express = require("express");
const path = require("path");
const app = express();
const hbs = require("hbs");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const auth = require("./middleware/auth");
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const crypto = require('crypto');
mongoose.connect("mongodb+srv://sakshigupta72985:mongocluster@cluster0.e0q8bep.mongodb.net/user");
const User= require("./models/user");
const {json} = require("express");
const port =process.env.PORT || 8000;
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:false}));
app.set("view engine","hbs");
const ResetToken = mongoose.model('ResetToken', {
    userId: String,
    token: String,
    expiresAt: Date,
  });
  app.get("/",(req,res)=>{
    res.render("signup");
});
app.get('/search/:name',async(req,res)=>{
  const userName=req.params.name;
  const result=await User.find({"userName":userName});
  if(result){
    res.status(201).send(result);
    console.log(result)
  }else{
    res.status(404).json({"err":"invalid request"})
  }
})
app.get("/search",(req,res)=>{
  res.render("search");
});
app.get("/login",(req,res)=>{
     res.render("login");
});
app.get("/signup",(req,res)=>{
    res.render("signup");
});
app.get("/forgot-password",(req,res,next)=>{
    res.render("forgot-password");
});
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'sakshigupta72985@gmail.com', // Replace with your Gmail email
      pass: 'mzqm mptd memv vfqa', // Replace with your Gmail password connect ETIMEDOUT 74.125.68.108:465
    },
  });
  app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
     const userId= user.id
      const token = await ResetToken.findOne( {userId} );
      console.log("token is")
      console.log(token.token)
      const mailOptions = {
        from: 'yoyo72985@gmail.com', // Replace with your Gmail email
        to: user.email,
        subject: 'Password Reset Request',
        text: `Click the following link to reset your password: http://localhost:3000/reset-password/${token.token}`,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return res.status(500).json({ message: 'Error sending email' });
        }
        console.log('Email sent: ' + info.response);
        res.json({ message: 'Password reset email sent' });
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
   app.put('/reset-password/:token', async (req, res) => {
     const { token } = req.params;
     const { newPassword } = req.body;
     try {
       const resetToken = await ResetToken.findOne({ token });
       console.log(token)
       if (!resetToken || resetToken.expiresAt < new Date()) {
         return res.status(400).json({ message: 'Invalid or expired token' });
       }
       const user = await User.findById(resetToken.userId);
       if (!user) {
         return res.status(404).json({ message: 'User not found' });
       }
       const hashedPassword = await bcrypt.hash(newPassword, 10);
       user.password = hashedPassword;
       await user.save();
       res.json({ message: 'Password reset successful' });
     } catch (error) {
         console.log(error);
         res.status(500).json({ message: 'Internal server error' });
       }
     });
     app.get('/reset-password/:token', async (req, res) => {
         const token = req.params.token;
         try {
           const user = await User.findOne({
             resetToken: token,
             resetTokenExpiry: { $gt: Date.now() },
           });
           res.render('reset-password', { token });
         } catch (err) {
           console.error(err);
           res.status(500).json({ message: 'Internal server error' });
         }
      }); 
app.get("/search-user/:name",async(req,res)=>{
  const name=req.params.name;
  let result=await Road.find({name:name}).select('-_id')
  res.send(result)
});
app.post("/signup",async (req,res)=>{
    try{
        const password = req.body.password;
        const cpassword = req.body.confirm_password;
        if(password===cpassword){
            const registerEmployee= new User({
                name:req.body.name,
                email:req.body.email,
                password:await bcrypt.hash(password,10),
                confirm_password:cpassword
            })
            console.log("the success part"+registerEmployee);
            const token =  await registerEmployee.generateAuthToken();
            console.log("the token part"+token);
            res.cookie("jwt",token,{
                expires:new Date(Date.now()+ 300000),
                httpOnly:true
            });
            const registered = await registerEmployee.save();
            console.log("the page part"+registered);
            res.status(201).render("front");
        }else{
            res.send("password are not matching")
        }
    }catch(error){
        res.status(400).send(error);
    }
});
app.post("/login",async(req,res)=>{
    try{
        const email = req.body.email;
        const password = req.body.password;
        if(email==="sakshi@gmail.com" && password==="1234"){
          res.status(201).render("admin");
        }else{
        const useremail = await User.findOne({email:email});
        const isMatch =await bcrypt.compare(password,useremail.password);
        const token =  await useremail.generateAuthToken();
        console.log("the token part  "+ token);
        res.cookie("jwt",token,{
            expires:new Date(Date.now()+ 300000),
            httpOnly:true
        });
      const expiresAt = new Date(Date.now() + 300000);
      const e = useremail._id;
      await ResetToken.deleteMany({userId:e})
      
      const resetToken = new ResetToken({
        userId: useremail._id,
        token,
        expiresAt,
      });
      await resetToken.save();
        if(isMatch){
            res.status(201).render("front");

        }else{
            res.send("Invalid login details");
        }
      }
    }catch(error){       
      res.status(400).send("invalid login details");

    } 
}
);
app.listen(port,()=>{
    console.log(`server is running at port no ${port}`);
})