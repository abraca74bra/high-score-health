import { db, collection, getDocs, doc, getDoc, setDoc, updateDoc } from './firebaseConfig.js';

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
        // Get the cached value of the header total from Firestore
        await this.loadHeaderTotal();

        // Load data for all tabs
        await this.loadTabData();
    },
    methods: {
        async loadHeaderTotal() {
            try {
                const docRef = doc(db, 'user', 'currentUser');
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    this.headerTotal = docSnap.data().headerTotal || 0;
                } else {
                    // Initialize if doesn't exist
                    this.headerTotal = 0;
                    await setDoc(docRef, { headerTotal: 0 });
                }
            } catch (error) {
                console.error('Error loading header total:', error);
                // Fallback to localStorage
                const runningTotal = localStorage.getItem('headerTotal');
                this.headerTotal = runningTotal ? parseFloat(runningTotal) : 0;
            }
        },
        async loadTabData() {
            try {
                this.earnData = await this.loadCollection('earn');
                this.redeemData = await this.loadCollection('redeem');
                this.historyData = await this.loadCollection('history');
            } catch (error) {
                console.error('Error loading tab data:', error);
            }
        },
        async loadCollection(collectionName) {
            try {
                const querySnapshot = await getDocs(collection(db, collectionName));
                const data = {};
                querySnapshot.forEach((doc) => {
                    data[doc.id] = doc.data();
                });
                return data;
            } catch (error) {
                console.error(`Error loading ${collectionName}:`, error);
                return {};
            }
        },
        openTab(tabName) {
            this.activeTab = tabName;
        },
        async addPoints(pointsToAdd) {
            this.headerTotal += pointsToAdd;
            
            // Save to both Firestore and localStorage
            try {
                const docRef = doc(db, 'user', 'currentUser');
                await updateDoc(docRef, { headerTotal: this.headerTotal });
            } catch (error) {
                console.error('Error updating Firestore:', error);
            }
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
        async resetPoints() {
            const resetTotal = parseFloat(this.resetPointsInput);
            if (!resetTotal && resetTotal !== 0) {
                return;
            }
            this.headerTotal = resetTotal;
            
            // Save to both Firestore and localStorage
            try {
                const docRef = doc(db, 'user', 'currentUser');
                await updateDoc(docRef, { headerTotal: resetTotal });
            } catch (error) {
                console.error('Error updating Firestore:', error);
            }
            localStorage.setItem("headerTotal", resetTotal);
            this.resetPointsInput = null;
        },
        earnPreset(entryId) {
            const entry = this.earnData[entryId];
            if (entry) {
                this.addPoints(entry.pointValue);
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
