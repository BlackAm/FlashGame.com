var express = require('express');
var http = require('http');
var serveStatic = require('serve-static');      //특정 폴더의 파일들을 특정 패스로 접근할 수 있도록 열어주는 역할
var path = require('path');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var expressErrorHandler = require('express-error-handler');
 
var mongoClient = require('mongodb').MongoClient;
 
 
 
var database;
 

//먼저 db를 가져온다 
function connectDB() {
   
    var databaseURL = 'mongodb://localhost:27017';
    mongoClient.connect(databaseURL,
        function (err, cluster)
        {
            //이 구문까지 실행되었다면 ongoDB 에 연결된 것
            if (err) {
                console.log('db connect error');
                return;
            }
 
            console.log('db was connected : ' + databaseURL);
 
            database = cluster.db('test');
 
            //var users = database.collection('users');
 
 
        }
    );
 
}
 
 
 
 
 
var app = express();      //express 서버 객체
 
 
app.set('port', 3000);
app.use(serveStatic(path.join('public', __dirname, 'public')));
 

 
var bodyParser_post = require('body-parser');       //post 방식 파서
//post 방식 일경우 begin
//post 의 방식은 url 에 추가하는 방식이 아니고 body 라는 곳에 추가하여 전송하는 방식
app.use(bodyParser_post.urlencoded({ extended: false }));            // post 방식 세팅
app.use(bodyParser_post.json());                                     // json 사용 하는 경우의 세팅
//post 방식 일경우 end
 
 
 
app.use(serveStatic(path.join(__dirname, 'public')));
 
 
//쿠키와 세션을 미들웨어로 등록한다
app.use(cookieParser());
 
//세션 환경 세팅
//세션은 서버쪽에 저장하는 것을 말하는데, 파일로 저장 할 수도 있고 레디스라고 하는 메모리DB등 다양한 저장소에 저장 할 수가 있는데
app.use(expressSession({
    secret: 'my key',           //이때의 옵션은 세션에 세이브 정보를 저장할때 할때 파일을 만들꺼냐 , 아니면 미리 만들어 놓을꺼냐 등에 대한 옵션들임
    resave: true,
    saveUninitialized: true
}));
 
app.get('/',function(req,res){
    res.sendFile(path.resolve(__dirname,'login.html'));
})
 
app.get('/login.html',function(req,res){
    res.sendFile(path.resolve(__dirname,'login.html'));
})
 
app.get('/Home.html',function(req,res){
    res.sendFile(path.resolve(__dirname,'Home.html'));
})
//라우트를 미들웨어에 등록하기 전에 라우터에 설정할 경로와 함수를 등록한다
//
//라우터를 사용 (특정 경로로 들어오는 요청에 대하여 함수를 수행 시킬 수가 있는 기능을 express 가 제공해 주는것)
var router = express.Router();
 
 
router.route('/process/login').post(
    function (req, res) {
        console.log('process/login 호출됨');
        var paramID = req.body.id || req.query.id;
        var paramPW = req.body.passwords || req.query.passwords;
        console.log('paramID : ' + paramID + ', paramPW : ' + paramPW);
 
        if (database) {
            authUser(database, paramID, paramPW,
                function (err, docs) {
                    if (database)
                    {
                        if (err) {
                            console.log('Error!!!');
                            res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                            res.write('<h1>에러발생</h1>');
                            res.end();
                            return;
                        }
 
                        if (docs) {
                            
                            //  console.dir(docs);
                            //  res.writeHead(200, { "Content-Type": "text/html; characterset=utf8" });
                            //  res.write('<link rel="stylesheet" href="/app.css">');
                            //  res.write('<div><h1>Login Success</h1>');
                            //  res.write('<h1> user </h1> ' +'&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbspID:'+ docs[0].id + '<br> &nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp name:' + docs[0].name);
                            //  res.end();
                             
                            res.sendFile(path.resolve(__dirname,'Home.html'));
                            
                        }
                        else {
                            console.log('empty Error!!!');
                            res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                            res.write('<h1>user data not exist</h1>');
                            res.write('<a href="/login.html"> re login</a>');
                            res.end();
                        }
 
                    }
                    else
                    {
                        console.log('DB 연결 안됨');
                        res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                        res.write('<h1>databasae 연결 안됨</h1>');
                        res.end();
                    }
 
 
 
                }
            );
        }
    }
);
 

 
 
router.route('/process/addUser').post(
 
    function (req, res)
    {
        console.log('process/addUser 호출됨');
        var paramID = req.body.id || req.query.id;
        var paramPW = req.body.passwords || req.query.passwords;
        var paramName = req.body.name || req.query.name;
        console.log('paramID : ' + paramID + ', paramPW : ' + paramPW);
 
        if (database)
        {
            addUser(database, paramID, paramPW, paramName,
                function (err, result)
                {
                    if (err)
                    {
                        console.log('Error!!!');
                        res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                        res.write('<h1>에러발생</h1>');
                        res.end();
                        return;
                    }
 
                    if (result) {
                        console.dir(result);
                        res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                        res.write('<link rel="stylesheet" href="/app.css">');
                        res.write('<div><h1>Add Success</h1>');
                        res.write('<h1> name </h1>' +'<h3>'+ paramName+'</h3>');
                        res.write('<br><h3><a href="/login.html">re login </a></h3></div>');
                        res.end();
                    }
                    else {
                        console.log('추가 안됨 Error!!!');
                        res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
                        res.write('<h1>can not add user</h1>');
                        res.write('<a href="/login.html"> re login</a>');
                        res.end();
                    }
 
                }
            );
        }
        else
        {
            console.log('DB 연결 안됨');
            res.writeHead(200, { "Content-Type": "text/html;characterset=utf8" });
            res.write('<h1>databasae 연결 안됨</h1>');
            res.end();
        }
       
    }
);
 
 
//라우터 미들웨어 등록하는 구간에서는 라우터를 모두  등록한 이후에 다른 것을 세팅한다
//그렇지 않으면 순서상 라우터 이외에 다른것이 먼저 실행될 수 있다
app.use('/', router);       //라우트 미들웨어를 등록한다
 
 
var authUser = function (db, id, password, callback) {
    var users = database.collection("users");
 
    //찾고자 하는 정보를 입력해준다
    //var result = users.find({ name: id, passwords: password });
    //var result = users.find({ "name": id, "passwords":password });
    //var result = users.find({ "name": id , "passwords": password });
    //var result = users.find({});
 
    var result = users.find({ "id": id, "passwords": password });
 
    result.toArray(
        function (err, docs) {
            if (err) {
                callback(err, null);
                return;
            }
 
            if (docs.length > 0) {
                console.log('find user [ ' + docs + ' ]');
                callback(null, docs);
            }
            else {
                console.log('can not find user [ ' + docs + ' ]');
                callback(null, null);
            }
        }
 
    );
 
};
 
 
 
var addUser = function (db, id, passwords, name, callback) {
    console.log('add User 호출됨' + id + '  , ' + passwords);
    var users = db.collection('users');
 
    //컬렉션에 데이터 추가할때는 배열 형태로 집어 넣는다
    users.insertMany([{ "id": id, "passwords": passwords, "name": name }],
        function (err, result) {
            if (err) {
                callback(err, null);
                return;
            }
 
            //데이터가 추가됐다면 insertedCount 카운트가 0 보다 큰값이 된다
            if (result.insertedCount > 0) {
                console.log('사용자 추가 됨' + result.insertedCount);
                callback(null, result);
            }
            else {
                console.log('사용자 추가 안됨' + result.insertedCount);
                callback(null, null);
 
            }
 
        }
    );
 
};
 
 
 
 
var errorHandler = expressErrorHandler(
    { static: { '404': './public/404.html' } } //404 에러 코드가 발생하면 해당 페이지를 보여주는 예외 미들웨어
);
 
app.use(expressErrorHandler.httpError(404));
app.use(expressErrorHandler);
 
//웹서버를 app 기반으로 생성
var appServer = http.createServer(app);
appServer.listen(app.get('port'),
    function () {
        console.log('express 웹서버 실행' + app.get('port'));
        connectDB();
    }
);
 


