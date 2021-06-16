var express = require('express')
var bodyParser = require('body-parser');
var mongoose = require('mongoose')

var app = express();

const uri = 'mongodb://127.0.0.1:27017/forestmaker';
var db = mongoose.connect(uri, (err) => {
    if (err) {
        console.log(err.message);
    } else {
        console.log('Successfully Connected!');
    }
});

var UserSchema = new mongoose.Schema({
    // id: mongoose.Schema.Types.ObjectId,
    id: { type: String, required: true, unique: true, lowercase: true },
    pw: {type: String, required: true, trim: true},
    nickname: {type: String, required: true},
    email: {type:String, required: true, unique:true},
    mileage: {type: Number, default: 0},
    treecnt: {type: Number, default: 0},
});

var Users = mongoose.model('users', UserSchema);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit:'1gb',extended:false}));

app.post('/signup', (req, res) => {
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

app.listen(4000, () => console.log("server on 4000"));
