// require ('dotenv').config({path: './env'})
import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
// import express from "express";
import { app } from "./app.js";

dotenv.config({path: './env'})

/*import express from "express"

const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`/`${DB_NAME}`)

        app.on("error",(error)=>{
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    } catch (error) {
        console.error("ERROR : ", error);
        throw error
    }
})()*/

connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR: ", error);
        throw error
    })
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err)=>{
    console.log("MONGO DB Connection FAILED !!! ", err)
})
