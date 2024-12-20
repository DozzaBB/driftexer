import playwright from "playwright";
import chromium from "@sparticuz/chromium-min";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from "node:fs";


import { config } from "./config.js";

async function singleItem(prompt, page) {
    
    // Select Driftex Reference.
    console.log("Opening the image drawer")
    await page.locator('div.rounded-md').first().click();
    console.log("Should be open now")
    // Find the driftex image and click.
    await page.locator('img.album-img').first().click();
    // go from here?
    console.log(`adding prompt ${prompt}`)
    await page.fill('textarea[placeholder="What do you want to draw?"]', prompt)
    console.log("clicking generate")
    await page.locator("span", { hasText: "Generate" }).first().click();
    console.log("waiting for completion...")
    await page.getByText("Generation Completed!").first().click({ timeout: 600 * 1000 });

    console.log("waiting for show-prompt")
    await page.waitForTimeout(2000); // let it load mofo.
    const i = await page.locator("img:near(.show-prompt)").first().elementHandle();
    const src = await i.getAttribute("src");
    console.log({ src, prompt });
    return { src, prompt };
}

async function makePage() {
    const browser = await playwright.chromium.launch({
        headless: true,
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
        )
    });
    const page = await browser.newPage()
    return { browser, page }
}

async function loginEtc(browser, page) {
    await page.goto("https://piclumen.com/app/account")
    console.log("Waiting for email input to appear.")
    await page.waitForSelector('input[type="email"]');
    console.log("Filling email")
    await page.fill('input[type="email"]', config.email);
    console.log("Waiting for password box")
    await page.waitForSelector('input[type="password"]');
    console.log("Filling password")
    await page.fill('input[type="password"]', config.password);
    console.log("Clicking sign in")
    await page.getByText("Sign in").click();
    console.log("Waiting for sign in to finish loading")
    await page.locator("span", { hasText: "Create" });
    console.log("finding create button")
    await page.goto("https://piclumen.com/app/image-generator/create");
    console.log(await page.title());
    return { page, browser }

}

export async function getImageForPrompt(prompt) {
    const { page, browser } = await loginEtc();
    const pair = await singleItem(prompt, page);
    return pair;
}

export async function getImagesForPrompts(prompts) {
    const { page, browser } = await loginEtc();
    const pairs = await promptLoop(prompts, page);
    return { pairs, browser }
}

async function promptLoop(prompts, page) {
    const pairs = [];
    for (const prompt of prompts) {
        const pair = await singleItem(prompt, page);
        await page.waitForTimeout(5000);
        pairs.push(pair);
    }
    return pairs;
}

export async function doDriftex(prompts) {

    console.log('Starting driftex loop');
    const { browser, page } = await makePage();
    try {
        await loginEtc(browser, page);
        // select the image dropdown.
        // Change model to piclumenrealisticv2
        console.log("Looking for model dropdown")
        // await page.locator('div.w-56').first().click();
        await page.locator("span", { hasText: "PicLumen Art V1" }).first().click();
        console.log("Selecting model")
        await page.locator("span", { hasText: "PicLumen Realistic V2" }).first().click();
        console.log("waiting")
        await page.waitForTimeout(1000);

        const pairs = await promptLoop(prompts, page);
        return { pairs, browser };
    } catch (e) {
        console.error(e);
        console.log("Failed, sending screenshot");
        await page.screenshot({ path: "/tmp/output.png" });
        const s3 = new S3Client({
            region: "ap-southeast-2",
            //   credentials: {
            //     secretAccessKey: secrets.secretKey,
            //     accessKeyId: secrets.accessKey
            //   }
        })
        console.log("Uploading to S3...")
        await s3.send(new PutObjectCommand({
            Bucket: "driftex",
            Key: "blah.png",
            Body: fs.readFileSync("/tmp/output.png")
        }))
    }

}

