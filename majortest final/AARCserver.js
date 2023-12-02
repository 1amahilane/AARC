const conn=require("./connection");
const Nodemail=require("nodemailer");
const multer=require("multer");
const fs=require("fs");
const expr=require("express");
const app=expr();
const cors=require("cors"); 
app.use(cors());                   
app.use(expr.json());
//app.use("public/uploads",expr.static("public/uploads"));
app.use("/public",expr.static("public"));
app.use("/images",expr.static("images"));
app.get("/",(req,res)=>
{
    res.sendFile(`${__dirname}/index.html`);
})

app.get("/rank",(req,res)=>
{
    res.sendFile(`${__dirname}/rating.html`);
})

function sendmail(mail,offcr)
{
    let transport= Nodemail.createTransport({
        service:"gmail",
        auth: {
            user:"1amahilane@gmail.com",
            pass:"pygczkhvqpsyravx"
        }
    });
        
    let mailContent={
          from:"1amahilane@gmail.com",
          to:mail,
          subject:"AARC goverent App complaint Responce by officer",
          text:"Your request has been considered by:"+offcr
    };

    transport.sendMail(mailContent, function(err,info){
        if(err) console.log(err);
        else { console.log("info:"+info.responce);}
    })
}

app.get(
       "/offices", async(req,res)=>
       { 
           let db= await conn();
           let coll= db.collection("offices");
           let data= await coll.find().toArray();
           res.send(JSON.stringify(data));
          
       }
)

const upload = multer({ 
    storage: multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'public/uploads'); 
    },
    // Sets file(s) to be saved in uploads folder in same directory
    filename: function (req, file, callback) {
        callback(null, file.originalname);  
    }

    // Sets saved filename(s) to be original filename(s)
  }) //,
 // fileFilter:
 
}).fields([{name:"files"},{name:"main"}]);


app.post(
         "/complain",upload, async(req,res)=>
         {
            let db= await conn();
            let coll=await db.collection("complaints");
            let index=await coll.find({"type":"count"}).toArray();
            index=index[0].count+1;
            coll.updateOne({"type":"count"},{$set:{"count":index}});
            
            links=[];
            let allfiles=req.files["files"]
            if(allfiles===undefined){console.log("Empty");}
            else for(let ele of allfiles)
                    links.push(ele["path"]);
                 
            let main= req.body.main;  
            let data=JSON.parse(main);
                data["pic"]=links;
                data["index"]=index;
                data["gmail_id"]=req.body.mail;
            let user=await db.collection("users"); 
            let identity=await user.find({"token":parseInt(req.body.token)}).toArray();
            if(identity.length>0) 
            {   
                data.From=identity[0];
                coll.insertOne(data);
                res.send(JSON.stringify("Your complaint has been recorded")); 
            }  
            else { res.send(JSON.stringify("Unresistered Token no. pls enter right Token or register again"));}
         

         
         
         })

app.put("/rating/:key",async(req,res)=>
{ 
    let db=await conn();
    let coll= await db.collection("officers");
    let officer= await coll.find({code:req.params.key}).toArray();
    

    let rate=officer[0].rateval+req.body.val;
    let count=officer[0].ratecount+1;
    let rating=rate/count;
    coll.updateOne({code:req.params.key},{$set:{rateval:rate,ratecount:count,rating:rating}})
    res.send(JSON.stringify("Done your rating"));
    
    
})

app.get("/ranking",async(req,res)=>
{
   let db= await conn();
   let coll= await db.collection("officers");
   let rank=await coll.find({"ratecount":{$gte:0}}).sort({"rating":1}).toArray(); //rating:-1 karege to decending order me milega
   rankList=[];
   rank.forEach((result)=>
   {
      let data={name:result.name_officer,post:result.office,rating:result.rating, count:result.ratecount};
      rankList.push(data);
   })
   res.send(JSON.stringify(rankList));
})

app.post("/complaintable",async(req,res)=>
{     
      let db=await conn();
      let coll=await db.collection("officers");
      let officer=await coll.find({"id":req.body.id,"pass":req.body.pass}).toArray();
      if(officer.length==0)  res.send(JSON.stringify("Your ID or Password Incorrect"));
      else
      {
         let code=officer[0].code;
         coll=await db.collection("complaints");
         let data= await coll.find({ "$or":[ {"DGP":{$regex:code}},{"IG":{$regex:code}},{"DIG":{$regex:code}},{"SP":{$regex:code}}]}).toArray();
         if(data.length==0) res.send(JSON.stringify("There are no Files"));
         else res.send(JSON.stringify(data));
      }
})


app.post(
    "/userreg", async(req,res)=>
    {
       let db= await conn();
       let coll=await db.collection("users");
       let userData=req.body; 
       userData.token= await Math.floor(Math.random()*123456);
       await coll.insertOne(req.body);       
       res.send(JSON.stringify("Your Resistration hase been done,Your Token is:"+userData.token));
    
    })

app.post(
        "/notify", async(req,res)=>
        {
          sendmail(req.body.mail,req.body.offcr);
        })    

app.listen(3100,()=>{console.log("Server is running on port 3100");}) 