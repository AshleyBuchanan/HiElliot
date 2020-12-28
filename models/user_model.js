const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	name        : String,
	screen_name : String,
	id_str      : String,
	tweets      : [
		{
			type : Schema.Types.ObjectId,
			ref  : 'Tweet'
		}
	]
});

module.exports = mongoose.model('User', userSchema);
