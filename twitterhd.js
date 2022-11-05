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
