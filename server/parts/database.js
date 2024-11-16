import { JSONFilePreset } from 'lowdb/node'

const blankDB = {
    settings: {},
    completedRuns: []
}
export const db = await JSONFilePreset('db.json', blankDB);

export const dbHandler = {
    getAllRuns() {
        return db.data.completedRuns
    },
    getEnsureRun(date) {
        let completedRun = db.data.completedRuns.find((r) => r.date === date);
        if (!completedRun) {
            completedRun = { date: date, pairs: []}
            db.data.completedRuns.push(completedRun);
        }
        db.write();
        return completedRun;
    },
    saveDB() {
        db.write();
    },
    latestRunDate() {
        const runs = this.getAllRuns();
        const latestRun = runs.sort((r1, r2) => Number.parseInt(r2.date) - Number.parseInt(r1.date));
        return latestRun.date;
    }

}