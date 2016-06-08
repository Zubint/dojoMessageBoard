var express=require('express');
var bodyParser=require('body-parser');
var mongoose = require('mongoose');
var app = express();

var Schema = mongoose.Schema;
mongoose.connect("mongodb://localhost/dojoMessageBoard");
mongoose.connection.on('error', function(err){console.log("There was an error connecting: " + err)});

var nameMinLength = [4, "{VALUE} is shorter than the minimum allowed length ({MINLENGTH} characters)."];

var PostSchema = new mongoose.Schema({
  name: {type: String, minlength: nameMinLength},
  message: String,
  comment: [{type: Schema.Types.ObjectId, ref:'Comment'}],
  created_on: Date,
  updated_on: Date
})

PostSchema.path('name').required(true, "You must provide your name");
PostSchema.path('message').required(true, "You must include a message for your post");

var CommentSchema = new mongoose.Schema({
  _post: [{type: Schema.Types.ObjectId, ref:"Post"}],
  comment: String,
  commentorName: {type:String, minlength: nameMinLength},
  created_on: Date,
  updated_on: Date
})

CommentSchema.path('comment').required(true, "You must include a message to make a comment");
CommentSchema.path('commentorName').required(true, "You must include your name to make a comment");

//schemas are created, now build models based on the schemas

var Post = mongoose.model("Post", PostSchema);
var Comment = mongoose.model("Comment", CommentSchema);

app.use(bodyParser.urlencoded({extended:true}));
app.set("views", __dirname+"/views");
app.use(express.static(__dirname+ "/views"));
app.set("view engine", "ejs");
var errorsArray = [];

app.get("/", function(req,res){

  //we need to populate the comments for each post
  Post.find({}).populate('comment').exec(function(err, posts){
    if(err){
      console.log(err)
    }else {
      res.render("index", {allPosts:posts, errors:errorsArray});
    }
  })
  //once you have data, you will need to populate the page;
  // console.log(Post);

})
app.post("/posts/add", function(req, res){
  //this is where you will add a new post
  // console.log(req.body);
  var post = new Post({
    name: req.body.name.trim(),
    message: req.body.message.trim(),
    created_on: Date("YYYY-MM-DD-THH:MM:SS"),
    updated_on: Date("YYYY-MM-DD-THH:MM:SS")
  })

  //now save it - catch any errors
  post.save(function(err, post){
    if(err){
       errorsArray =[];
      for (var idx in err.errors){
        errorsArray[err.errors[idx].path] = err.errors[idx].message;  //this creates an array with indexes you can match to
        //individual inputs on the html page.  makes it really easy to do user friendly errors.
      }
      // console.log(err.errors);
      // console.log(errorsArray);
      res.redirect("/");
    }else {
      res.redirect("/");
    }
  })


})

app.post("/posts/:id/addComment", function(req, res){
  //use the post ID to create a new comment:
  // console.log(req.params.id);

  var comment = new Comment({
    _post: req.params.id,
    comment: req.body.comment.trim(),
    commentorName: req.body.commentor.trim()
  })

  comment.save(function(err){
    if(err){
        errorsArray=[];
        for(var idx in err.errors){
          errorsArray[err.errors[idx].path] = err.errors[idx].message
        }
      }else {
          //push this to the comment field in the Post table
          //so that you track it.
          Post.findOne({_id:req.params.id}, function(err, post){
            if(err){
              console.log(err)
            }else
            {
              // console.log(post.comment);
              post.comment.push(comment); //this adds the new comment to the comments array
              post.save(function(err){
                if(err){
                  console.log(err);
                }
              })
              // console.log(post.comment);
            }
          })
        }
      res.redirect("/");
  })

})

app.listen(8000, function(){
  console.log("Listening on port 8000");
})
