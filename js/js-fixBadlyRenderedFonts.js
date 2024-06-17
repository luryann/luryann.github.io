// a hack to make virtually any browser display the content properly independent of the screen width
// Why, I love font rendering quirks too!

window.addEventListener("resize", fixFonts);
window.addEventListener("DOMContentLoaded", fixFonts);

function fixFonts() {
	let width = document.querySelector("body").scrollWidth;
	if(width > 768) {
		if(width % 2 == 1) {
			document.querySelector("#header_right > ul").style.paddingRight=".8px";
			document.querySelector("#header_right > h1").style.paddingRight="1px";
			document.querySelector("#content").style.maxWidth="769px";
			document.querySelectorAll("small, h4").forEach((elem) => {
				elem.style.paddingLeft="1px";
			});
		} else {
			document.querySelector("#header_right > ul").style.paddingRight="0px";
			document.querySelector("#header_right > h1").style.paddingRight="0px";
			document.querySelector("#content").style.maxWidth="768px";
			document.querySelectorAll("small, h4").forEach((elem) => {
				elem.style.paddingLeft="0px";
			});
		}
	} else {
		if(width % 2 == 1) {
			document.querySelector("#header_right > ul").style.paddingRight=".8px";
			document.querySelector("#header_right > h1").style.paddingRight="1px";
			document.querySelectorAll("small, h4").forEach((elem) => {
				elem.style.paddingLeft="1px";
			});
		} else {
			document.querySelector("#header_right > ul").style.paddingRight="0px";
			document.querySelector("#header_right > h1").style.paddingRight="0px";
			document.querySelectorAll("small, h4").forEach((elem) => {
				elem.style.paddingLeft="0px";
			});
		}
	}
}
