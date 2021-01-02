let record;
let lis;
let bigBlockIdStore = '';
let bigBlockTrigger = false;
let bigBlockAlpha = 0.01;
let bigBlockHeight = 1.0;
let displaysTrigger = false;
let userListAlpha = 0.01;
let userListHeight = 1.0;
let splitHeight = 1.0;

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

			//axios!!!!
			resRetweetId = await axios.get(`/retweet/${databar.value}`);
			console.log(resRetweetId.data.data);

			const bigBlock = document.createElement('div');
			bigBlock.classList.add('big-block');
			const row = document.createElement('div');
			row.classList.add('row');
			const column1 = document.createElement('div');
			column1.classList.add('col-4');
			//column1.classList.add('orange');
			column1.classList.add('column');
			column1.classList.add('control');
			//column1.style.overflow = 'hidden';
			//column1.innerText = 'one';
			const column2 = document.createElement('div');
			column2.classList.add('col-8');
			//column2.classList.add('yellow');
			column2.classList.add('column');
			column2.classList.add('a-control');
			//column2.innerText = 'Two';
			const row1 = document.createElement('div');
			row1.classList.add('split');
			const row2 = document.createElement('div');
			row2.classList.add('red');
			row2.classList.add('split');
			//row2.innerText = 'Three';
			for (let grouping of groupings) {
				grouping.classList.add('blurred');
			}

			//information fill
			const ul = document.createElement('ul');
			ul.style.paddingLeft = '0';
			column1.appendChild(ul);

			for (let user of resRetweetId.data.data.user) {
				//for (let i = 0; i < 2; i++) {
				const li = document.createElement('li');
				li.classList.add('user-list');
				li.innerText = `${user.screen_name}`;
				ul.appendChild(li);
			}
			column2.appendChild(row1);
			column2.appendChild(row2);

			let showText = true;
			if (resRetweetId.data.data.full_text) {
				const fullText = document.createElement('p');
				fullText.innerHTML = `<p><strong>full_text: "</strong> ${resRetweetId.data.data.full_text} <strong>"</strong></p>`;
				row1.appendChild(fullText);
				showText = false;
			}

			if (resRetweetId.data.data.quoted_text) {
				const quotedText = document.createElement('p');
				quotedText.innerHTML = `<p><strong>quoted_text: "</strong> ${resRetweetId.data.data.quoted_text} <strong>"</strong></p>`;
				row1.appendChild(quotedText);
			}

			if (resRetweetId.data.data.retweeted_text) {
				const retweetedText = document.createElement('p');
				retweetedText.innerHTML = `<p><strong>retweeted_text: "</strong> ${resRetweetId.data.data.retweeted_text} <strong>"</strong></p>`;
				row1.appendChild(retweetedText);
				showText = false;
			}

			if (showText) {
				const stext = document.createElement('p');
				stext.innerText = `text: \" ${resRetweetId.data.data.text} \"`;
				row1.appendChild(stext);
			}

			row.appendChild(column1);
			row.appendChild(column2);
			bigBlock.appendChild(row);
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
		tweetElement.classList.add('tweet-text');
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
		alphaCheck(bigBlock, bigBlockAlpha);
		sizeCheck(bigBlock, bigBlockHeight, 'displaysTrigger', 75);
	}

	//if bigBlock has appeared, fit the two columns
	const columns = document.querySelectorAll('.column');
	const rows = document.querySelectorAll('.split');
	if (displaysTrigger) {
		//console.log('is true');
		for (let column of columns) {
			alphaCheck(column, userListAlpha);
			sizeCheck(column, userListHeight, '-', 74);
			//console.log(parseInt(column.style.height));
			rows[0].style.height = `${parseFloat(column.style.height) * 0.5}vh`;
			rows[1].style.height = `${parseFloat(column.style.height) * 0.5}vh`;
		}
	} else {
		for (let column of columns) {
			sizeCheck(column, userListHeight, '-', 74);
		}
	}
}, 300);

//superfluous animations	-----------------------------------------------
setInterval(() => {
	//if lis are being created, show putin
	//and align his goofiness to the li window
	const lis = document.querySelectorAll('.tweet-text');
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

const alphaCheck = (el, a) => {
	if (el.style.opacity === '') {
		let aCycle = setInterval(() => {
			if (a < 1.0) {
				a *= 1.1;
				a = Math.min(1.0, a);
				el.style.opacity = a;
			} else {
				clearInterval(aCycle);
			}
		}, 10);
	}
};

const sizeCheck = (el, h, name, limit) => {
	if (!limit) {
		console.log('limit assigned 75');
		limit = 75.0;
	}
	if (el.style.height === '') {
		console.log('run');
		let aCycle = setInterval(() => {
			if (h < limit) {
				h *= 1.1;
				h = Math.min(limit, h);
				el.style.height = `${h}vh`;
				let diff = (100.0 - h) * 0.5;
				el.style.top = `${diff}vh`;
			} else {
				clearInterval(aCycle);
				variableSwitcher(name);
			}
		}, 10);
	} else {
		return true;
	}
};

const variableSwitcher = name => {
	if (name === 'displaysTrigger') {
		displaysTrigger = true;
	}
};
