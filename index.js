if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const User = require('./models/user_model');
const Tweet = require('./models/tweet_model');
const twit = require('twit');
const { aggregate } = require('./models/user_model');

const configT = {
	api_key: process.env.api_key,
	api_key_secret: process.env.api_key_secret,
	bearer_token: process.env.bearer_token,
	access_token: process.env.access_token,
	access_token_secret: process.env.access_token_secret,
};

//initializations
mongoose.connect('mongodb://localhost:27017/tweets', {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async () => {
	console.log('db connected');
	//get 7 recently retrieved tweets
	const entries = await Tweet.find()
		.sort({ _id: -1 })
		.limit(14)
		.populate('user');
	//console.log('t-', entries);
	for (let entry of entries) {
		texts.push(`${entry.user[0].screen_name} --> ${entry.text}`);
	}
});

const T = new twit({
	consumer_key: configT.api_key,
	consumer_secret: configT.api_key_secret,
	access_token: configT.access_token,
	access_token_secret: configT.access_token_secret,
	timeout_ms: 5 * 1000,
});
const texts = [];
let netting = [];

const currentparams = {
	method: 'stream',
	count: '1',
	language: 'en',
	location: 'sanFrancisco',
	phrases: [],
};

// T.get('search/tweets', { q: 'banana since:2020-12-19', count: 1 }, function(err, data, res) {
// 	console.log(data);
// });

const earth = [];
const sanFrancisco = ['-122.75', '36.8', '-121.75', '37.8'];

const search = async function (method, count, language, location, phrases) {
	let counter = 0;
	if (method === 'stream') {
		console.log(phrases);
		console.log(
			`{ '${phrases}', 'stream', ${count}, '${language}', '${location}' }`,
		);
		const stream = T.stream('statuses/filter', {
			track: phrases,
			language: language,
			locations: sanFrancisco,
			extended: true,
		});

		stream.on('tweet', async tweet => {
			let full_text = '';
			let quoted_text = '';
			let retweeted_text = '';
			if (tweet.extended_tweet !== undefined) {
				let t = tweet.extended_tweet;
				//console.log('extended_tweet:', t.full_text);
				full_text = t.full_text;
			}
			if (tweet.quoted_status !== undefined) {
				let t = tweet.quoted_status;
				try {
					//console.log('qouted_status:', t.extended_tweet.full_text);
					quoted_text = t.extended_tweet.full_text;
				} catch (e) {
					//console.log('qouted_status:', t.text);
					quoted_text = t.text;
				}
			}
			if (tweet.retweeted_status !== undefined) {
				let t = tweet.retweeted_status;
				try {
					//console.log('retweeted_status:', t.extended_tweet.full_text);
					retweeted_text = t.extended_tweet.full_text;
				} catch (e) {
					//console.log('retweeted_status:', t.text);
					retweeted_text = t.text;
				}
			}

			counter++;
			if (counter >= count) {
				stream.stop();
				console.log('\n:finished');
			}

			if (tweet.user.screen_name) {
				let user;
				user = await User.findOne({
					screen_name: tweet.user.screen_name,
				});
				if (user === null) {
					console.log(`new user ${tweet.user.screen_name} created`);
					user = new User();
					user.name = tweet.user.name;
					user.screen_name = tweet.user.screen_name;
					user.id_str = tweet.user.id_str;
				}

				let newFlag = false;
				let tweetObj;
				tweetObj = await Tweet.findOne({ text: tweet.text });
				if (tweetObj === null) {
					console.log(
						`new tweet for ${tweet.user.screen_name} created`,
					);
					newFlag = true;
					tweetObj = new Tweet();
					tweetObj.text = tweet.text;
					tweetObj.full_text = full_text;
					tweetObj.quoted_text = quoted_text;
					tweetObj.retweeted_text = retweeted_text;
					tweetObj.created_at = tweet.created_at;
					tweetObj.search_phrases.push(phrases);
					tweetObj.user.push(user);
				} else {
					console.log(
						`${tweet.user.screen_name} pushed to existing tweet ${tweetObj._id}`,
					);
					newFlag = true;
					tweetObj.user.push(user);
				}

				if (newFlag === true) {
					user.tweets.push(tweetObj);
				}
				await tweetObj.save();
				await user.save();
				texts.unshift(`${tweet.user.screen_name} --> ${tweet.text}`);
				//console.log(texts.length);
				if (texts.length > 14) {
					texts.pop();
				}
			}
		});
	} else if (method === 'restful') {
		console.log(
			`{ '${phrase}', 'restful', ${count}, '${language}', '${location}' }`,
		);
	}
};

app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
	console.log(`hit '/'`);
	//console.log('texts:', texts);
	res.render('home', { texts, currentparams });
});

app.get('/lookat', async (req, res) => {
	const { method, count, language, location, phrases } = req.query;
	currentparams.method = method;
	currentparams.count = count;
	currentparams.language = language;
	currentparams.location = location;
	currentparams.phrases = [];
	currentparams.phrases.push(...phrases);
	currentparams.phrases = currentparams.phrases.filter(el => {
		return el != '';
	});
	console.log(`hit '/lookat/[${currentparams.phrases}]`);
	await search(method, count, language, location, currentparams.phrases);
	res.redirect('/');
});

app.get('/texts', (req, res) => {
	const transmission = texts.shift();
	if (transmission) {
		//console.log('trans:', transmission);
		res.send({ data: transmission });
	} else {
		res.send({ data: '' });
	}
});

app.get('/retweets', async (req, res) => {
	const transmission = await Tweet.find({ __v: { $gt: 1 } })
		.sort({ __v: 'desc' })
		.limit(10);
	if (transmission) {
		//console.log('trans:', transmission);
		res.send({ data: transmission });
	} else {
		res.send({ data: '' });
	}
});

app.listen(3000, (req, res) => {
	console.log('serving on :3000');
});

app.get('/retweet/:id', async (req, res) => {
	//console.log(req.params.id);
	//res.send(req.params.id);
	const transmission = await Tweet.findOne({ _id: req.params.id });
	res.send({ data: transmission });
});
//mongo syntax:
//db.tweets.find({user: {$in:[ObjectId("5fe4e79e5d468b044721a664")]}})
