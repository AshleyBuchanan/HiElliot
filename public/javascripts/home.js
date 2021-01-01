let record;
let lis;
let bigBlockIdStore = '';
let bigBlockTrigger = false;
let bigBlockAlpha = 0.01;
let bigBlockHeight = 1.0;
let displaysTrigger = false;
let userListAlpha = 0.01;
let userListHeight = 1.0;

//test update
const putin = document.querySelector('.putin');
const recents = document.querySelector('.recents');
const phraseRow = document.querySelector('#phrase-row');
const addPhraseDiv = document.querySelector('.button-holder');
const addPhrase = document.querySelector('#add-phrase');
const dataShowman = document.querySelector('#data-showman');

for (let i = 0; i < 10; i++) {
	const el = document.createElement('div');
	el.classList.add('col-sm');
	el.innerText = `${i}`;

	const inEl = document.createElement('div');
	inEl.classList.add('data');
	inEl.style.height = '10px';
	el.appendChild(inEl);
	dataShowman.appendChild(el);
}
const dataBars = document.querySelectorAll('.data');
for (let databar of dataBars) {
	databar.addEventListener('click', async () => {
		console.log('clicked', databar.value);

		if (bigBlockIdStore === databar.value) {
			bigBlockTrigger = !bigBlockTrigger;
		} else {
			bigBlockIdStore = databar.value;
			bigBlockTrigger = true;
		}

		const older = document.querySelector('.big-block');
		if (older) {
			document.body.removeChild(older);
			bigBlockAlpha = 0.01;
			bigBlockHeight = 1.0;
		}

		for (let d of dataBars) {
			d.classList.remove('active');
		}
		const groupings = document.querySelectorAll('.grouping');
		for (let grouping of groupings) {
			grouping.classList.remove('blurred');
		}
		if (bigBlockTrigger) {
			databar.classList.add('active');

			resRetweetId = await axios.get(`/retweet/${databar.value}`);
			console.log(resRetweetId.data.data);

			const bigBlock = document.createElement('div');
			bigBlock.classList.add('big-block');
			for (let grouping of groupings) {
				grouping.classList.add('blurred');
			}
			document.body.appendChild(bigBlock);
		} else {
			displaysTrigger = false;
		}
	});
}

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

const collectedTexts = [];
let top10Retweets;
let intervalThrottle = 20.0;
const loop = async () => {
	let resTexts;
	let resRetweets;

	try {
		resTexts = await axios.get(`/texts`);

		if (resTexts && resTexts.data.data) {
			collectedTexts.push(resTexts.data.data);
			intervalThrottle *= 0.5;
		} else {
			intervalThrottle *= 2;
		}

		resRetweets = await axios.get(`/retweets`);
		if (resRetweets.data.data) {
			top10Retweets = resRetweets.data.data;
			top10Retweets.sort(compare);
		}
	} catch (e) {
		console.log(e);
		intervalThrottle *= 4;
	}

	intervalThrottle = Math.min(5000.0, Math.max(20.0, intervalThrottle));
	setTimeout(loop, intervalThrottle);
};
loop();

//build and update visual components	-----------------------------------
setInterval(() => {
	//tweet cloud
	const recentsStyle = getComputedStyle(recents);
	if (collectedTexts.length) {
		const tweetElement = document.createElement('li');
		tweetElement.innerText = collectedTexts.shift();
		tweetElement.style.opacity = 0.0025;
		tweetElement.style.top = '93vh';
		tweetElement.style.width = `${parseFloat(recentsStyle.width) - 50}px`;
		tweetElement.constructor.prototype.data = 0.08;
		recents.appendChild(tweetElement);
	}

	//top-ten retweet-count graph
	if (top10Retweets && top10Retweets.length > 0) {
		for (let i = 0; i < 10; i++) {
			const { __v, _id } = top10Retweets.shift();
			dataBars[i].style.height = `${__v}px`;
			dataBars[i].value = `${_id}`;
		}
	}

	//if show page is created, trigger appearance functions
	const bigBlock = document.querySelector('.big-block');
	if (bigBlock && bigBlock.style.opacity === '') {
		alphaCheck(bigBlock);
		sizeCheck(bigBlock, showDisplays);
	}
}, 300);

//superfluous animations	-----------------------------------------------
setInterval(() => {
	//if lis are being created, show putin
	//and align his goofiness to the li window
	const lis = document.querySelectorAll('li');
	if (lis.length > 0) {
		putin.style.opacity = 0.25;
		putin.style.top = `${
			getOffset(recents).top + recents.clientHeight - putin.height + 3
		}px`;
	} else {
		putin.style.opacity = 0.0;
	}

	//float lis into oblivion
	let i = 0;
	for (let li of lis) {
		i++;
		li.data *= 1.0025;
		let y_pos = parseFloat(li.style.top) - li.data * 2;
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

//simplification functions	-----------------------------------------------
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

function compare(a, b) {
	const elementA = a._id.toUpperCase();
	const elementB = b._id.toUpperCase();

	let comparison = 0;
	if (elementA > elementB) {
		comparison = 1;
	} else if (elementA < elementB) {
		comparison = -1;
	}
	return comparison;
}

const alphaCheck = el => {
	if (el.style.opacity === '') {
		let aCycle = setInterval(() => {
			if (bigBlockAlpha < 1.0) {
				bigBlockAlpha *= 1.1;
				bigBlockAlpha = Math.min(1.0, bigBlockAlpha);
				el.style.opacity = bigBlockAlpha;
			} else {
				clearInterval(aCycle);
			}
		}, 10);
	}
};

const sizeCheck = (el, fn) => {
	if (el.style.height === '') {
		let aCycle = setInterval(() => {
			if (bigBlockHeight < 75.0) {
				bigBlockHeight *= 1.1;
				bigBlockHeight = Math.min(75.0, bigBlockHeight);
				el.style.height = `${bigBlockHeight}vh`;
				let diff = (100.0 - bigBlockHeight) * 0.5;
				el.style.top = `${diff}vh`;
			} else {
				clearInterval(aCycle);
				fn();
			}
		}, 10);
	}
};

const showDisplays = () => {
	displaysTrigger = true;
	console.log(displaysTrigger);
};
