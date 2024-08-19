// ==UserScript==
// @name         Banishing Cube
// @namespace    http://tampermonkey.net/
// @version      2024-08-18
// @description  Banish unruly YouTube re-recs into the void
// @author       Aegis
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

// Select the target element. You may need to change this if Youtube changes significantly.
// Use Dev console and find the element you want the Cube next to, right click, Copy -> CSS Selector, and paste it here.
const targetElement = document.querySelector("#masthead > div:nth-child(5)");

const workerURL = 'https://example-worker.dev/' // Put your Cloudflare Worker url here

// CSS styles for the Cube
const cubeCss = `
    .cube {
        position: absolute;
        top: 25%; /* Adjust this as needed */
        left: 35%; /* Adjust this as needed */
        width: 25px;
        height: 25px;
        cursor: pointer;
        z-index: 10000; /* Ensure the cube stays above other elements */
    }
    .cube div {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        animation: animate 6s linear infinite;
        transform: rotateX(-20deg) rotateY(25deg);
    }
    @keyframes animate {
        0% {
            transform: rotateX(-20deg) rotateY(360deg);
        }
        100% {
            transform: rotateX(-20deg) rotateY(0deg);
        }
    }
    .cube .big span {
        position: absolute;
        width: 25px;
        height: 25px;
        background: transparent;
        border: 2px solid #00ff00;
        transform: rotateY(calc(90deg * var(--i))) translateZ(14px);
        transform-style: preserve-3d;
    }
    .cube:hover .big span {
        background: transparent;
        border: 2px solid #00ff00;
        filter: drop-shadow(0 0 20px #00ff00);
    }
    .cube .big span.top {
        transform: rotateX(90deg) translateZ(12.5px);
    }
    .cube .big span.top::before {
        content: '';
        position: absolute;
        inset: 0;
        transform: translateZ(-27px);
        background: transparent;
    }
    @keyframes flashRed {
        0% {
            border-color: #00ff00; /* Default green */
            filter: drop-shadow(0 0 20px #00ff00);
        }
        50% {
            border-color: #ff0000; /* Flashing red */
            filter: drop-shadow(0 0 20px #ff0000);
        }
        100% {
            border-color: #00ff00; /* Back to green */
            filter: drop-shadow(0 0 20px #00ff00);
        }
    } /* Allow visual checking of errors */
    .cube.error .big span {
        animation: flashRed 1s ease-out;
    }
    @keyframes flashBlue {
        0% {
            border-color: #00ff00; /* Default green */
            filter: drop-shadow(0 0 20px #00ff00);
        }
        50% {
            border-color: #0000ff; /* Flashing blue */
            filter: drop-shadow(0 0 20px #0000ff);
        }
        100% {
            border-color: #00ff00; /* Back to green */
            filter: drop-shadow(0 0 20px #00ff00);
        }
    } /* Allow visual checking of success */
    .cube.success .big span {
        animation: flashBlue 1s ease-out;
    }
`;

// Create a <style> element and append the CSS
const styleElement = document.createElement("style");
styleElement.textContent = cubeCss;
document.head.appendChild(styleElement);

// HTML to draw the Cube
const cubeHtml = `
        <div class="cube">
            <div class="big">
                <span style="--i:0;--clr:#00ff00;"></span>
                <span style="--i:1;--clr:#00ff00;"></span>
                <span style="--i:2;--clr:#00ff00;"></span>
                <span style="--i:3;--clr:#00ff00;"></span>
                <span class="top" style="--i:3;--clr:#00ff00;"></span>
            </div>
        </div>
`;

// Insert the Cube before the target element
if (targetElement) {
  targetElement.insertAdjacentHTML('beforeend', cubeHtml);
} else {
  console.error("Target element not found");
}

// Function to send the current URL to the Cloudflare Worker
function sendUrlToCloudflare() {
    const currentUrl = window.location.href;

    // Parse the URL and extract the path after www.youtube.com
    const baseUrl = 'https://www.youtube.com';
    let path = currentUrl.replace(baseUrl, '');

    // Remove any leading '?' or '#' from the path if present
    path = path.replace(/^[?#]/, '');

    // Define the data in the required format
    const formattedData = `www.youtube.com##ytd-rich-item-renderer:has(a[href*="${path}"])`;
   // Use Tampermonkey to get around CORS restrictions. I don't know why it works, check the docs.
    GM_xmlhttpRequest({
        method: 'POST',
        url: workerURL,
        headers: {
            'Content-Type': 'application/json',
        },
        data: JSON.stringify({ url: formattedData }),
        onload: function(response) {
            const cube = document.querySelector('.cube'); // Load the Cube as a modifiable object
            if (response.status === 200) {
                try {
                    const data = JSON.parse(response.responseText);
                    console.log('URL appended:', data);
                    if (cube) {
                        cube.classList.add('success');
                        setTimeout(() => {
                            cube.classList.remove('success');
                        }, 1000); // Remove the class after 1 second
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            } else {
                console.error(`Network response was not ok: ${response.statusText}`); // This usually indicates an error in your Cloudflare Worker code, or R2 CORS settings
                if (cube) {
                    cube.classList.add('error');
                    setTimeout(() => {
                        cube.classList.remove('error');
                    }, 1000); // Remove the class after 1 second
                }
            }
        },
        onerror: function(error) {
            console.error('Error:', error);
            const cube = document.querySelector('.cube');
            if (cube) {
                cube.classList.add('error');
                setTimeout(() => {
                    cube.classList.remove('error');
                }, 1000); // Remove the class after 1 second
            }
        }
    });
}

// Add an event listener to the cube to handle clicks
document.querySelector('.cube').addEventListener('click', sendUrlToCloudflare);

})();
