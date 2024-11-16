import { chromium } from "playwright";
import { config } from "./config.js";

async function singleItem(prompt, page) {
    console.log(`adding prompt ${prompt}`)
    await page.fill('textarea[placeholder="What do you want to draw?"]', prompt)
    console.log("clicking generate")
    await page.locator("span",{hasText: "Generate"}).first().click();
    console.log("waiting for completion...")
    await page.getByText("Generation Completed!").first().click({force: true, timeout: 600 * 1000});
    
    console.log("waiting for show-prompt")
    await page.waitForTimeout(2000); // let it load mofo.
    const i = await page.locator("img:near(.show-prompt)").first().elementHandle();
    const src = await i.getAttribute("src");
    console.log({src, desc: prompt})
    return { src: src, desc: prompt };
}

async function loginEtc() {
    const browser = await chromium.launch({headless: true});
    const page = await browser.newPage()
    await page.goto("https://piclumen.com/app/image-generator/create")
    // await page.getByText("Sign in with Google").first().click({force: true});
    console.log("Done")
    console.log("Filling email")
    await page.fill('input[type="email"]', config.email);
    console.log("Filling password")
    await page.fill('input[type="password"]', config.password);
    console.log("Signing in")
    await page.getByText("Sign in").click({force: true});
    console.log("finding create button")
    await page.locator("span", {hasText: "Create"}).first().click();
    return { page, browser }
    
}

export async function getImageForPrompt(prompt) {
    const {page, browser} = await loginEtc();
    const pair = await singleItem(prompt, page);
    return pair;
}

export async function getImagesForPrompts(prompts) {
    const {page, browser} = await loginEtc();
    const  pairs = await promptLoop(prompts, page);
    return { pairs, browser }
}

async function promptLoop(prompts, page) {
    const pairs = [];
    let counter = (prompts.length);
    for (const prompt of prompts) {
        console.log(`${counter} remaining...`);
        counter -= 1;
        const pair = await singleItem(prompt, page);
        await page.waitForTimeout(5000);
        pairs.push(pair);
    }
    return pairs;
}

export async function doDriftex(prompts) {
    const {page, browser} = await loginEtc();
    // select the image dropdown.
    await page.locator('svg.text-2xl').first().click();
    // Find the driftex image and click.
    await page.locator('img.album-img').first().click();
    // go from here?
    const pairs = await promptLoop(prompts, page);
    return { pairs, browser };
}

export async function doSingleDriftex(prompt) {
    const {page, browser} = await loginEtc();
    // select the image dropdown.
    await page.locator('svg.text-2xl').first().click();
    // Find the driftex image and click.
    await page.locator('img.album-img').first().click();
    // go from here?
    const pair = await singleItem(prompt, page);
    browser.close();
    return pair;

}


