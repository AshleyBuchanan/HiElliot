const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
	text           : String,
	full_text      : String,
	quoted_text    : String,
	retweeted_text : String,
	created_at     : String,
	search_phrases : {
		type : Array
	},
	user           : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'User'
		}
	]
});

module.exports = mongoose.model('Tweet', tweetSchema);
