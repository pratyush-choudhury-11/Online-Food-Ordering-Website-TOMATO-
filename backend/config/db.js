import mongoose from "mongoose";

const  connectDB = async () =>{

    await mongoose.connect('mongodb+srv://subhajit:Fq8yZiIPeqA20qV3@cluster0.hvsbm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(()=>console.log("DB Connected"));
   
}

export default connectDB;
// add your mongoDB connection string above.
// Do not use '@' symbol in your databse user's password else it will show an error.