let record;
let lis;

const putin = document.querySelector('.putin');
const recents = document.querySelector('.recents');
const phraseRow = document.querySelector('#phrase-row');
const addPhraseDiv = document.querySelector('.button-holder');
const addPhrase = document.querySelector('#add-phrase');

let phraseIndex = 1;
addPhrase.addEventListener('click', () => {
	if (phraseIndex === 7) return;
	phraseIndex++;
	phraseRow.removeChild(addPhraseDiv);
	const newPhraseDiv = document.createElement('div');
	newPhraseDiv.classList.add('param-input');
	newPhraseDiv.classList.add('col-3');
	newPhraseDiv.classList.add('mt-1');
	const newPhraseInput = document.createElement('input');
	newPhraseInput.classList.add('form-control');
	newPhraseInput.classList.add('form-control-sm');
	newPhraseInput.name = `phrases[${phraseIndex}]`.type = 'text'.id = `phrases[${phraseIndex}]`;
	newPhraseInput.placeholder = `phrase[${phraseIndex}]`;
	newPhraseDiv.appendChild(newPhraseInput);
	phraseRow.appendChild(newPhraseDiv);
	phraseRow.appendChild(addPhraseDiv);
});

// for (let i = 0; i < 14; i++) {
// 	const tweetElement = document.createElement('li');
// 	tweetElement.innerText = '-';
// 	tweetElement.style.opacity = 0.5;
// 	recents.appendChild(tweetElement);
// }

const collectedTexts = []; // 'A', 'B', 'C', 'D' ];
const top10Retweets = [];
let intervalThrottle = 2.0;
setInterval(async () => {
	intervalThrottle = Math.min(Math.max(intervalThrottle, 2.0), 1000.0);
	let resTexts;
	let resRetweets;
	//console.log(intervalThrottle);
	try {
		resTexts = await axios.get(`/texts`);
		if (resTexts.data.data) {
			//console.log(resTexts);
			collectedTexts.push(resTexts.data.data);
		}
		resRetweets = await axios.get(`/retweets`);
		if (resRetweets.data.data) {
			//	console.log(resRetweets.data.data);
			top10Retweets.push(resRetweets.data.data);
		}
		intervalThrottle *= 0.5;
	} catch (e) {
		intervalThrottle *= 2;
	}
}, 100 * intervalThrottle);

setInterval(() => {
	const recentsStyle = getComputedStyle(recents);
	if (collectedTexts.length) {
		//console.log('coll:', collectedTexts[0]);
		const text = collectedTexts.shift();
		const tweetElement = document.createElement('li');
		tweetElement.innerText = text;
		tweetElement.style.opacity = 0.0025;
		tweetElement.style.top = '93vh';
		tweetElement.style.width = `${parseFloat(recentsStyle.width) - 50}px`;
		//console.log(recentsStyle.width);
		//tweetElement.style.maxWidth = parseFloat(recentsStyle.width) - 100;
		tweetElement.constructor.prototype.data = 0.08;
		recents.appendChild(tweetElement);
	}
	//console.log(`${getOffset(recents).top + recents.clientHeight - putin.height + 3}px`);
	putin.style.top = `${getOffset(recents).top + recents.clientHeight - putin.height + 3}px`;
}, 400);

setInterval(() => {
	const lis = document.querySelectorAll('li');
	let c = 0;
	if (lis.length > 0) {
		putin.style.opacity = 0.25;
	} else {
		putin.style.opacity = 0.0;
	}
	for (let li of lis) {
		c++;
		li.data *= 1.0025;
		//console.log(c, data);
		let y_pos = parseFloat(li.style.top) - li.data * 2; //0.995;
		let alpha = parseFloat(li.style.opacity);

		if (y_pos > 38.0) {
			if (alpha < 1.0) {
				alpha *= 1.075;
			} else {
				alpha = 1.0;
			}
		} else {
			if (alpha > 0.0) {
				alpha -= 0.1;
			} else {
				alpha = 0.0;
				recents.removeChild(li);
			}
		}
		li.style.top = `${y_pos}vh`;
		li.style.opacity = alpha;
	}
}, 12.5);
// setInterval(async () => {
// 	const res = await axios.get(`/texts`);
// 	const texts = res.data.data;
// 	if (texts !== record) {
// 		record = texts;
// 		lis = document.querySelectorAll('li');

// 		//console.log(texts[0]);
// 		for (let i = 0; i < 14; i++) {
// 			tweetThing[i].new_text = texts[i];
// 			if (i > 0) {
// 				tweetThing[i].next_text = texts[i - 1];
// 			}
// 		}
// 	}

// 	console.log('interval run');
// }, 200);

// //	const lis = document.querySelectorAll('li');
// //	for (let li of lis) {
// //		//recents.removeChild(li);
// //	}
// setInterval(() => {
// 	for (let i = 0; i < 14; i++) {
// 		if (tweetThing[i].text !== tweetThing[i].new_text) {
// 			if (tweetThing[i].new_text !== tweetThing[i].next_text) {
// 				tweetThing[i].fadeOut = true;
// 			} else {
// 				tweetThing[i].text = tweetThing[i].new_text;
// 			}
// 		}

// 		if (tweetThing[i].fadeOut === false) {
// 			if (tweetThing[i].alpha < 1.0) {
// 				tweetThing[i].alpha += 0.32;
// 			} else {
// 				tweetThing[i].alpha = 1.0;
// 			}
// 		}
// 		if (tweetThing[i].fadeOut === true) {
// 			if (tweetThing[i].alpha > 0.0) {
// 				tweetThing[i].alpha -= 0.32;
// 			} else {
// 				tweetThing[i].alpha = 0.0;
// 				tweetThing[i].text = tweetThing[i].new_text;
// 				tweetThing[i].fadeOut = false;
// 			}
// 		}

// 		if (lis) {
// 			lis[i].innerText = tweetThing[i].text;
// 			lis[i].style.opacity = tweetThing[i].alpha;
// 		}
// 	}
// }, 80);

function getOffset(el) {
	var _x = 0;
	var _y = 0;
	while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
		_x += el.offsetLeft - el.scrollLeft;
		_y += el.offsetTop - el.scrollTop;
		el = el.offsetParent;
	}
	return { top: _y, left: _x };
}
