/* IMAGE STUFF */

// Options for the observer (which mutations to observe)
const config = { attributes: false, childList: true, subtree: true };

// Upgrade any and all images to "orig" resolution
const upgradeImg = (img) => {
	const url = new URL(img.src);
	if (url.host !== "pbs.twimg.com") return;
	const orig_name = url.searchParams.get("name");
	if (orig_name === null || orig_name === "orig") return;

	console.log(`TwitterHD: upgrading '${img.src}'`)
	url.searchParams.set("name", "orig");
	img.src = url.href;
};

// Callback function to execute when mutations are observed
const callback = (mutationList, observer) => {
	for (const mutation of mutationList) {
		if (mutation.type === "childList") {
			//console.log('A child node has been added or removed.');
			for (const addedNode of mutation.addedNodes) {
				//console.log(`${addedNode} was added`);
				if (addedNode instanceof HTMLImageElement) {
					upgradeImg(addedNode);
				}
			}
		} else if (mutation.type === "attributes") {
			//console.log(`The ${mutation.attributeName} attribute was modified for ${mutation.target}.`);
		}
	}
};

// Create an observer instance linked to the callback function
const observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(document.body, config);


/* VIDEO STUFF */

const manifest_split_regex = /#EXT-X-STREAM-INF:([^\r\n]*)(?:[\r\n](?:#[^\r\n]*)?)*([^\r\n]+)|#EXT-X-SESSION-DATA:([^\r\n]*)[\r\n]+/g;
const bandwidth_re = /^#EXT-X-STREAM-INF:.*BANDWIDTH=([0-9]+).*$/gm;
const bandwidth_re_nl = /\n#EXT-X-STREAM-INF:.*BANDWIDTH=[0-9]+.*\n.*$/gm

// filter out all but the highest bitrate stream.
const filter_streams = (str) => {
	//console.log("input:", str);

	// figure out the bitrate of the highest-bitrate stream (this is a bit of a hack)
	bandwidth_re.lastIndex = 0;
	const max_bitrate = Math.max(...Array.from(str.matchAll(bandwidth_re)).map((x) => parseInt(x[1])));
	console.log(`TwitterHD: Detected max bitrate video stream: ${max_bitrate}`)
	// replace any streams with less-than-max bitrate
	const res = str.replace(bandwidth_re_nl, (x) => {
		bandwidth_re.lastIndex = 0;
		const bw = parseInt(bandwidth_re.exec(x)[1]);
		return bw < max_bitrate ? "" : x;
	});
	//console.log("output:", res);
	return res;
};

// hook RegExp.prototype.exec to detect the master playlist being parsed
RegExp.prototype.orig_exec = RegExp.prototype.exec;
RegExp.prototype.exec = function(str) {
	if (this.source !== manifest_split_regex.source) {
		// continue transparently
		return RegExp.prototype.orig_exec.apply(this, arguments);
	}
	// pre-filter the input, and then mimic original behavior
	return RegExp.prototype.orig_exec.apply(this, [filter_streams(str)]);
}
