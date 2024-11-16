import { dbHandler } from './database.js';
import { getToday } from './utils.js';
import { getSite } from './oftheday.js';
import { doDriftex } from './playwright.js';

export function mlLoop() {
    workflow();
    setInterval(workflow, 1000 * 3600);
}

async function workflow() {
    const today = getToday();
    const lastread = dbHandler.latestRunDate();
    console.log(`Date is ${today}`);
    if (today !== lastread) {
        console.log("Date changed since last run, running!");

        const prompts = await getSite();
        const mappedPrompts = prompts.map((p) => `A vehicle in the style of ${p}`);
        const mp = [mappedPrompts[0]]
        const { pairs } = await doDriftex(mp);

        // commit to db.
        const run = dbHandler.getEnsureRun(today);
        run.pairs = run.pairs.concat(pairs)
        dbHandler.saveDB();
    } else {
        console.log("Day hasnt changed, dont do anything");
    }
    
}