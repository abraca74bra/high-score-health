const { createApp } = Vue;

createApp({
    data() {
        return {
            headerTotal: 0,
            activeTab: 'Earn',
            earnData: {},
            redeemData: {},
            historyData: {},
            addPointsInput: null,
            subtractPointsInput: null,
            resetPointsInput: null
        }
    },
    async mounted() {
        // Get the cached value of the header total
        const runningTotal = localStorage.getItem('headerTotal');
        this.headerTotal = runningTotal ? parseFloat(runningTotal) : 0;

        // Load data for all tabs
        await this.loadTabData();
    },
    methods: {
        async loadTabData() {
            try {
                this.earnData = await this.loadJSON('earn.json');
                this.redeemData = await this.loadJSON('redeem.json');
                this.historyData = await this.loadJSON('history.json');
            } catch (error) {
                console.error('Error loading tab data:', error);
            }
        },
        async loadJSON(fileName) {
            try {
                const response = await fetch(fileName);
                if (!response.ok) {
                    throw new Error(`Failed to load JSON: ${response.statusText}`);
                }
                const jsonData = await response.json();
                return jsonData;
            } catch (error) {
                console.error('Error loading JSON:', error);
                return {};
            }
        },
        openTab(tabName) {
            this.activeTab = tabName;
        },
        addPoints(pointsToAdd) {
            this.headerTotal += pointsToAdd;
            localStorage.setItem("headerTotal", this.headerTotal);
        },
        addCustomPoints() {
            const pointsToAdd = Math.abs(parseFloat(this.addPointsInput));
            if (!pointsToAdd) {
                return;
            }
            this.addPoints(pointsToAdd);
            this.addPointsInput = null;
        },
        subtractCustomPoints() {
            const pointsToSubtract = Math.abs(parseFloat(this.subtractPointsInput));
            if (!pointsToSubtract) {
                return;
            }
            this.addPoints(pointsToSubtract * -1);
            this.subtractPointsInput = null;
        },
        resetPoints() {
            const resetTotal = parseFloat(this.resetPointsInput);
            if (!resetTotal && resetTotal !== 0) {
                return;
            }
            this.headerTotal = resetTotal;
            localStorage.setItem("headerTotal", resetTotal);
            this.resetPointsInput = null;
        },
        earnPreset(entryId) {
            const entry = this.earnData[entryId];
            if (entry) {
                this.addPoints(entry.pointValue);
                // Can't do file updates (for history or use count) until we have a backend
            }
        },
        redeemPreset(entryId) {
            const entry = this.redeemData[entryId];
            if (entry) {
                this.addPoints(entry.pointValue * -1);
            }
        },
        viewHistory(entryId) {
            // Placeholder for future functionality
        }
    }
}).mount('#app');
