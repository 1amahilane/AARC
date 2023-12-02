const {MongoClient}=require("mongodb");
const url="mongodb://localhost:27017";
const database="police";
const client=new MongoClient(url);

async function connection()
  {
    let result=await client.connect();
     return db= result.db(database);
    // return db.collection('offices');
     
  
  }
  module.exports=connection;

