var express = require('express');
var bodyParser = require('body-parser');
var assert = require('assert');
var async = require('async');

var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var app = express();
var url = 'mongodb://127.0.0.1:27017/forestmaker';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ 
    extended: true
}));

var mongoose = require('mongoose');
const { ObjectID } = require('bson');
const { json } = require('body-parser');

var UserSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, lowercase: true },
    pw: {type: String, required: true, trim: true},
    nickname: {type: String, required: true},
    mileage: {type: Number, default: 0},
    treecnt: {type: Number, default: 0},
});

mongoose.set('useCreateIndex', true);
var Users = mongoose.model('users', UserSchema);

app.post('/signup2', function(request, response){ // 성공
    id = request.body.id;
    pw = request.body.pw;
    nickname = request.body.nickname;

    console.log('id: ' + id + "/ pw: " + pw + "/ nickname: " + nickname);

    //몽고디비에 저장//
    insert_mongodb(id, pw, nickname, response);

    response.send('success...');
});

app.post('/signup', (req, res) => { // 안됨
    var new_user = new Users(req.body);

    new_user.save((err) => {
        if (err) {
            console.log(err.message);
            return res.status(500).json({message: '저장 실패'});
        } else return res.status(200).json({message: '저장 성공', data: new_user});
    });
});

app.post('/signin', async (req, res) => {
	let result = await Users.findOne({ id: req.body.id, pw: req.body.pw });
	if (!result) return res.status(404).json({ message: '유저 없음' });
	return res.status(200).json({ message: '유저 찾음', data: result });
});

app.post('/main', function(request, response){
    id = request.body.id;
    // MAIN //
    request_main(id, response);
});

app.post('/store_rental', function(request, response){
    console.log('find store-rental');

    // 상점 - 대여용품 조회
    find_store_rental(response);
});

app.post('/store_tonic', function(request, response){
    console.log('find store-tonic');

    // 상점 - 영양제 조회   
    find_store_tonic(response);
});

/* 나의 나무 */
app.post('/mytrees', function(request, response){
    userid = request.body.userid;
    console.log('find mytrees');

    // 나의 나무 - 리스트    
    find_my_trees(userid, response);
});

app.post('/mytrees_update', function(request, response){
    console.log('update mytrees');
    treeid = request.body._id;
    contents= request.body.contents;
    console.log("_id : "+treeid);
    // 나의 나무 - 내용 수정    
    update_my_trees(treeid, contents, response);
});

app.post('/mypage', function(request, response){
    console.log('my page');

    userid = request.body.id;
    console.log("userid : "+userid);
    
    // 마이페이지
    mypage(userid, response);

});

app.post('/gongbang', function(req, response){
    console.log('공방 조회');
    // 공방
    gongbang(response);
});

app.post('/forestschool', function(req, response){
    console.log('forest school');
    // 숲학교
    forestschool(response);
});

app.listen(9872, function(){
    console.log('Connected 9872 port')
    console.log('--------------------------');
});

function insert_mongodb(id, pw, nickname, response)
{
    async.waterfall([
        function(callback)
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                db = database.db('forestmaker'); // 추가
                callback(null, id, pw, nickname);
            });
        },
        function(id, pw, nickname, callback)
        {
            db.collection('users')
            .insertOne( {
                "id": id,
                "pw": pw,
                "nickname": nickname
            }, function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the restaurants collection.");
                callback(null, 'insert succcess mongodb'); //수정필요
            });
        }
    ],

    function(callback, message)
    {
        response.send(message);
        console.log('--------------------------');
    });
}

function connect_mongodb()
{
    async.waterfall([
        function(callback)
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                console.log('Connected correctly to server');
                db = database.db('forestmaker');
                callback(null, db);
            });
        }
    ],
    function(callback, db)
    {
        return db;
    });
}

function request_main(id, response)
{
    async.waterfall([
        function(callback) 
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                db = database.db('forestmaker');
                callback(null, db);
            });
        },

        function(db, callback)
        { 
            db.collection('users', function(err, collection) {
                collection
                .findOne({
                    "id": id
                },
                {_id: false, pw: false},
                function(err, items) {
                    assert.equal(err, null);
                    callback(null, 'find ok MAIN...', items, db)
            })
            })
        },

        function(message, doc, db, callback)
        {
            console.log(message);
            // response.send(doc);
            callback(null, doc, db);
        },

        function(main, db, callback)
        {
            db.collection('forest_school', function(err, collection) {
                collection
                .find()
                .toArray(function(err, items) {
                    assert.equal(err, null);
                    callback(null, main, items);
                });
            });
        }
    ],
    function(callback, main, forest)
    {
        response.status(200).json({main: main, forest: forest});
        console.log('--------------------------');
    });
}

function find_store_rental(response)
{
    async.waterfall([
        function(callback) 
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);

                db = database.db('forestmaker'); // 추가

                callback(null, db);
            });
        },
        function(db, callback)
        {
            
            db.collection('store_rental', function(err, collection) {
                collection
                .find()
                .toArray(function(err, items) {
                    assert.equal(err, null);
                    callback(null, 'find ok...', items);
                });
            });
        }
    ],
    function(callback, message, doc)
    {
        console.log(message);
        response.send(doc);
        console.log('--------------------------');
    });
}

function find_store_tonic(response)
{
    async.waterfall([
        
        function(callback)
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);

                db = database.db('forestmaker'); // 추가

                callback(null, db);
            });
        },
        function(db, callback)
        {

            db.collection('store_tonic', function(err, collection) {
                collection
                .find()
                .toArray(function(err, items) {
                    assert.equal(err, null);
                    callback(null, 'find ok...', items);
                });
            });
        }
    ],
    function(callback, message, doc)
    {
        console.log(message);
        response.send(doc);
        console.log('--------------------------');
    });
}

function find_my_trees(userid, response)
{
    async.waterfall([
        function(callback) 
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                db = database.db('forestmaker');
                callback(null, db);
            });
        },

        function(db, callback)
        {
            db.collection('users_tree', function(err, collection) {
                collection
                .find({
                    "userid":userid
                })
                .sort({
                    "date":-1
                })
                .toArray(function(err, items) {
                    assert.equal(err, null);
                    console.log(items);
                    callback(null, 'find ok...', items);
                });
            });
        }
    ],
    function(callback, message, doc)
    {
        // console.log(message);
        response.send(doc);
        console.log('--------------------------');
    });
}

function update_my_trees(treeid, contents, response)
{
    async.waterfall([
        function(callback)
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                db = database.db('forestmaker');
                callback(null, db);
            });
        },
        function(db, callback)
        {
            db.collection('users_tree').updateOne(
                {_id: new ObjectID(treeid)}, // here4you.tistory.com/92
                {$set: {"contents":contents}}, 
            function(err, results){
                assert.equal(null, err);
                // console.log(results);
                callback(null, 'update ok');
            });
        }
    ],
    function(callback, message)
    {
        console.log(message);
        response.send(message);
        console.log('--------------------------');
    });
}

function mypage(userid, response)
{
    async.waterfall([
        function(callback) 
        {
            MongoClient.connect(url, function(err, database){
                assert.equal(null, err);
                db = database.db('forestmaker');
                callback(null, db);
            });
        },
        function(db, callback)
        {
            db.collection('users', function(err, collection) {
                collection
                .findOne({id: userid}, {_id: false, pw: false},
                    function(err, userinfo){
                        assert.equal(err, null);
                        callback(null, userinfo);
                    });
            });
        }
    ],
    function(callback, userinfo)
    {
        response.send(userinfo);
        console.log('--------------------------');
    });
}

function gongbang(response)
{
    var gongbangList = new Array();
    
    var gb1 = new Object();
    gb1.name = "뚝딱뚝딱 나무로 주방용품 만들기 프로그램";
    gb1.description = "폐 나무로 나만의 나무 수저, 칫솔, 도마, 밥 그릇 등을 만들어 보아요.";
    gb1.address = "경기도 용인시 처인구 모현읍 초부로 220";
    gb1.hours = "09:00 ~ 18:00";
    gb1.runtime = "90분 이내 / 회";
    gb1.participants = "7세 이상";
    gb1.fee = "20,000원";
    gb1.fee_int = 20000;
    gb1.img_list = new Array();
    gb1.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMTAy/MDAxNjI1OTExMDA4NTU1.ZvQMnxqHC7-GinT-cwyuOZIvha4acBQqewWBJ1v-AoIg.f2ecryPHa_2elkyQFG2vqtaANAMWAn1I40NH6oUcDQIg.PNG.ghyun0914/19.png?type=w773");
    gb1.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjE3/MDAxNjI1OTExMDA4NTYz.pNTIbwmXUri4PSqWkmW7lnrL5pZ2K2tOlKlRadMpT44g.J_k--5GVVXl7EPaLmr1tRsjXVsJKhWdWqwhrvYbVQJQg.PNG.ghyun0914/20.png?type=w773");
    gb1.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjI4/MDAxNjI1OTExMDA4NTY1.ozGldF7xtrDZvThDqDgtjvYuL42VhMrQ4kxUS2rb23Ag.wmH1wf0fuXgLci8f2tT8oVaimvyFYis6TE9d7N-YbI0g.PNG.ghyun0914/21.png?type=w773");

    gongbangList.push(gb1);

    var gb2 = new Object();
    gb2.name = "썩은 나무로 의자 만들기 프로그램";
    gb2.description = "썩은 나무로 가공한 목재를 이용해 나만의 의자를 만들어 보아요.";
    gb2.address = "경기 김포시 하성면 봉성로 188-80";
    gb2.hours = "09:00 ~ 18:00";
    gb2.runtime = "90분 이내 / 회";
    gb2.participants = "10세 이상";
    gb2.fee = "50,000원";
    gb2.fee_int = 50000;
    gb2.img_list = new Array();
    gb2.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfODUg/MDAxNjI1OTA3ODUzMzc0.0b2pppT8uTAHfrtD6sc_qOdMZS1TpSbyQ4gq2zDHuUwg.qmmxwTqP2HvDKaM_j41_w1O24m1iM0dCj9jYE54_jMkg.JPEG.ghyun0914/%EC%9D%98%EC%9E%90_%EB%A7%8C%EB%93%A4%EA%B8%B05.jpg?type=w773");
    gb2.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjI4/MDAxNjI1OTA3ODUyNTkw.yZ9JMKXAy-7hVmVRzFyimYzkXmKyzb2cHiQ0pgZdK5og.odiiQs35QgNMl-jiICNoHk5oPn0LP64WvwsDHFivfCkg.JPEG.ghyun0914/%EC%9D%98%EC%9E%90_%EB%A7%8C%EB%93%A4%EA%B8%B01.jpg?type=w773");
    gb2.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMTIz/MDAxNjI1OTA3ODUxODI4.14KH5Iq2JY-EjReryTIGnAnL5Ht--dk68Na_3h9Me5Eg.jSK3YbvoIfaINURIWPIXPnRK5etinDSaAVZpSYjQK0Yg.JPEG.ghyun0914/%EC%9D%98%EC%9E%90_%EB%A7%8C%EB%93%A4%EA%B8%B02.jpg?type=w773");
    gb2.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjk5/MDAxNjI1OTA3ODUxNjE5.LsAozCGMr2QPXJrXFJ_6ZNXKTuIecIPFsxDBJJZfLb8g.OrAzr6FVR1yof9bWNqXHjvtFFLba4bgyVeTz9LlCP-4g.JPEG.ghyun0914/%EC%9D%98%EC%9E%90_%EB%A7%8C%EB%93%A4%EA%B8%B03.jpg?type=w773");
    gb2.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMTUg/MDAxNjI1OTA3ODUyMjQz.NKURAiSz7p14xU54hlmTJZofXw3Ztyv0ao-UyjMV8UAg.LondhqZ7hVbn5xkmo6cxdXl7ig_VdfiA4N2QINlsv3Ig.JPEG.ghyun0914/%EC%9D%98%EC%9E%90_%EB%A7%8C%EB%93%A4%EA%B8%B04.jpg?type=w773");
    
    gongbangList.push(gb2);

    var gb3 = new Object();
    gb3.name = "폐목재로 만드는 나만의 나무 푯말 만들기 프로그램";
    gb3.description = "재활용 목재를 이용해 내가 심은 나무에 어울리는 이쁜 나무 푯말을 만들어봐요!\n어울리는 재활용 목재를 고르고 다듬고 색칠하여 나만의 푯말을 만들 수 있습니다.";
    gb3.address = "경기도 용인시 처인구 역북동 180-1";
    gb3.hours = "09:00 ~ 18:00";
    gb3.runtime = "120분 이내 / 회";
    gb3.participants = "9세 이상";
    gb3.fee = "10,000원"
    gb3.fee_int = 10000;
    gb3.img_list = new Array();
    gb3.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMTk4/MDAxNjI1OTA3OTU5NDAw.PySJiEBjTj7aRz0AuL5IkCoEekZZJ-Zszug3EtfHkL0g.dy7QEAmo2ggrgT3bjor9OnFxMJqKLuVF4aW4RyBLY8Ag.JPEG.ghyun0914/%ED%91%AF%EB%A7%90_%EB%A7%8C%EB%93%A4%EA%B8%B04.jpg?type=w773");
    gb3.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjk3/MDAxNjI1OTA3OTYyMDQw.dtpSTiYqqysSJqK2p_SCcoWXTq3utmC5UYe5ET7mvbkg.FTaBVrlJ6FyVxbpk62HSKxQBXFONIkU6ku-lm2QntRwg.JPEG.ghyun0914/%ED%91%AF%EB%A7%90_%EB%A7%8C%EB%93%A4%EA%B8%B01.jpg?type=w773");
    gb3.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjk0/MDAxNjI1OTA3OTYxNjAx._p-x3ZVGVFiS_LqRK3MUOkNJkCT9KyxXqVi10ocELXcg.6_TC5qiuEN4Hlfx45svA_keRjqaE9KSu4CNwhDQU46Mg.JPEG.ghyun0914/%ED%91%AF%EB%A7%90_%EB%A7%8C%EB%93%A4%EA%B8%B02.jpg?type=w773");
    gb3.img_list.push("https://postfiles.pstatic.net/MjAyMTA3MTBfMjA4/MDAxNjI1OTA3OTYyMjUx.uC4Rs6bstcxkvxBK52vf1mK6O9kw6AQszPAK7Nd8N9Ag.NrHku3qSqXpqvuC9pk102JwXS_IbXNxnU44s1q_GOY0g.JPEG.ghyun0914/%ED%91%AF%EB%A7%90_%EB%A7%8C%EB%93%A4%EA%B8%B03.jpg?type=w773");
    
    gongbangList.push(gb3);


    console.log('--------------------------');
    response.json(gongbangList);
}

function forestschool(response)
{
    var schoolList = new Array();

    var sc1 = new Object();
    sc1.name = "숲 전문가와 함께하는 둘레길 숲 해설";
    sc1.address = "강원 원주 판부 백운산길 95";
    sc1.hours = "09:00 ~ 18:00";
    sc1.runtime = "60분 이내 / 1회";
    sc1.participants = "6세 ~ 8세 어린이 참여 가능";
    sc1.fee = "20,000원";
    sc1.fee_int = 20000;
    sc1.info = "숲 전문가에게 듣는 숲길 속 식물 해설\n둘레길 속 징검다리 건너기 체험\n숲속 나무 안아보기 체험";
    sc1.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMTUx/MDAxNjI1OTEyMTY1NTU4.2QQlEDpSJDjHvBQuEACYE2iOrVmiRd9w2veGCRwc1Uwg.OYG9ePRTqZHOI-9E8ntosMKQKB916_rcGYRYrNxBk5Qg.JPEG.ghyun0914/%EB%91%98%EB%A0%88%EA%B8%B8.jpg?type=w773";
    schoolList.push(sc1);

    var sc2 = new Object();
    sc2.name = "피톤치드 뿜뿜 나무 공부하기";
    sc2.address = "대구광역시 달서구 공원순환로 12";
    sc2.hours = "09:00 ~ 18:00";
    sc2.runtime = "30분 이내 / 1회";
    sc2.participants = "전 연령 참여 가능";
    sc2.fee = "10,000원";
    sc2.fee_int = 10000;
    sc2.info = "나무의 나이 맞춰보기 체험\n피톤치드의 상쾌함 느껴보기 체험\n침엽수, 활엽수 공부해보기 체험";
    sc2.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMTM1/MDAxNjI1OTEyMTY0NDkx.acK-iu87ks5CjuY3cPuWKhe6ELaS-Nsa5U9ZyAFZaBQg.iWv0VT7KVPjpSIfAUpB6z4LzdcEy-j_QJsS84WhoBh4g.JPEG.ghyun0914/%ED%94%BC%ED%86%A4%EC%B9%98%EB%93%9C.jpg?type=w773";
    schoolList.push(sc2);

    var sc3 = new Object();
    sc3.name = "엄마와 아이랑 같이 하는 명상 채험";
    sc3.address = "전남 담양 용 추월산로 593";
    sc3.hours = "10:00 ~ 12:00";
    sc3.runtime = "40분 이내 / 1회";
    sc3.participants = "10세 이하, 어머님 참여 가능";
    sc3.fee = "10,000원";
    sc3.fee_int = 10000;
    sc3.info = "아이와 엄마와 함께하는 명상 시간\n계절에 맞는 꽃차 우려서 마시기 체험\n나무에 기대어 스트레칭 체험";
    sc3.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMTg1/MDAxNjI1OTEyMTY2MjA0.fXNg2_KhgyRBMC2BsVFlPtb_3byO_A_rjEz2UFYMpFQg.NyzfHpvhO2GyysarurJEUxDBmPLtRkKXHMx14lo2v78g.JPEG.ghyun0914/%EB%AA%85%EC%83%81.jpg?type=w773";
    schoolList.push(sc3);

    var sc4 = new Object();
    sc4.name = "우리 숲에 살고 있는 동물과 식물 소개";
    sc4.address = "춘천 신북 유포 산52-11";
    sc4.hours = "13:00 ~ 18:00";
    sc4.runtime = "180분 이내 / 1회";
    sc4.participants = "7세 ~ 13세";
    sc4.fee = "30,000원";
    sc4.fee_int = 30000;
    sc4.info = "숲속에서 내가 좋아하는 동물찾기\n숲속에 사는 식물 관찰하기\n꽃으로 왕관 만들기";
    sc4.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMjc3/MDAxNjI1OTEyMTY1MjI3.yk3YEO8U1LfjyPVSMqAXkw4au3mwmwky5KTRaJ9mZ9Ig.OeDjrpo2kwWm7dXYCGzxuu9Ju6yEAqxyUARJuAOpLQMg.JPEG.ghyun0914/%EB%8F%99%EC%8B%9D%EB%AC%BC.jpg?type=w773";
    schoolList.push(sc4);

    var sc5 = new Object();
    sc5.name = "스트레스 날릴 수 있는 힐링체험";
    sc5.address = "강원 평창 대관령 14-214";
    sc5.hours = "13:00 ~ 18:00";
    sc5.runtime = "60분 이내 / 1회";
    sc5.participants = "전 연령 참여 가능";
    sc5.fee = "20,000원";
    sc5.fee_int = 20000;
    sc5.info = "맨발로 촉촉한 여름숲길 걷기\n기운 쑥쑥 숲 체조\n스트레스 타파 족욕 체험";
    sc5.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMTMz/MDAxNjI1OTEyMTY1Nzgx.0j9_NfI4MW2mv0b6lLpqCJuujliyyyP1PAFDNY5pU3Yg.OYGvdI3MBlB0tUHsgIjazQZ9fEWdmqNhkaRzdzJCe5Ug.JPEG.ghyun0914/%ED%9E%90%EB%A7%81%EC%B2%B4%ED%97%98.jpg?type=w773";
    schoolList.push(sc5);

    var sc6 = new Object();
    sc6.name = "맨발로 흙 걷기 체험";
    sc6.address = "광주 남 사 177";
    sc6.hours = "11:00 ~ 18:00";
    sc6.runtime = "60분 이내 / 1회";
    sc6.participants = "전 연령 참여 가능";
    sc6.fee = "10,000원";
    sc6.fee_int = 10000;
    sc6.info = "혈액순환에 좋은 화산송이 흙길 걷기\n피부가 좋아지는 흙 찜질 하기\n황토로 고구마, 감자 구어먹기";
    sc6.image = "https://postfiles.pstatic.net/MjAyMTA3MTBfMTE4/MDAxNjI1OTEyMTYwMDcy.xIuuDtqOIj8M78cjRHxQkY2otSqZmSxVHC8_Uo0b-Lwg.r-MN94ImV8MM-WqusPdoz7Tjj46z4Etd7WXc7lwu0JIg.JPEG.ghyun0914/%EB%A7%A8%EB%B0%9C%EB%A1%9C.jpg?type=w773";
    schoolList.push(sc6);

    response.json(schoolList);
    console.log('--------------------------');
}