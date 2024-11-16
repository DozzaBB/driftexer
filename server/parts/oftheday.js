// Get day of the year website and see whats there.
import { parse } from "node-html-parser";

export function getSite() {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' }).toLowerCase();
    return new Promise((resolve, reject) => {
        fetch(`https://nationaltoday.com/${month}-${day}-holidays/`).then((r) => {
            r.text()
            .then((a) => {
                try { 
                    const root = parse(a)
                    const b = root.querySelectorAll("[class='holiday-title']");
                    const parts = b.map((p) => p.innerText);
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

getSite();
