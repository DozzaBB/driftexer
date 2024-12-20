// Get day of the year website and see whats there.
import { parse } from "node-html-parser";

export function getSite() {
    return new Promise((resolve, reject) => {
        fetch("https://nationaltoday.com/today/").then((r) => {
            r.text()
            .then((a) => {
                try { 
                    const root = parse(a)
                    const b = root.querySelectorAll("[name='description']");
                    const description = b[0].getAttribute("content");
                    // split out the date and cut by commas.
                    const stripped = description?.split(" - ")[1];
                    const parts = stripped?.split(", ");
                    console.log(`Shit of the day:`)
                    parts.forEach((p) => { console.log(p) });
                    parts[0] = parts[0].replace("Today is",""); // get rid of today is.
                    resolve(parts ?? []);
                } catch (e) {
                    reject(e)
                }
                
                })
                .catch((e) => {
                    reject(e);
                });
        });
    })
}
