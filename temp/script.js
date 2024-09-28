// Firebase configuration
const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Handle user authentication
document.getElementById('auth-btn').onclick = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password).then(() => {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('add-item').style.display = 'block';
        loadClothingItems();
    }).catch((error) => {
        console.error("Error signing in: ", error);
    });
};

document.getElementById('signup-btn').onclick = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password).then(() => {
        document.getElementById('auth').style.display = 'none';
        document.getElementById('add-item').style.display = 'block';
    }).catch((error) => {
        console.error("Error signing up: ", error);
    });
};

// Add clothing item
document.getElementById('clothing-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const type = document.getElementById('type').value;
    const color = document.getElementById('color').value;
    const size = document.getElementById('size').value;

    db.collection('clothing').add({
        name,
        type,
        color,
        size,
        userId: auth.currentUser.uid, // Store user ID with each item
        usageCount: 0 // Initialize usage count
    }).then(() => {
        loadClothingItems();
        this.reset();
    }).catch((error) => {
        console.error("Error adding item: ", error);
    });
});

// Load clothing items
function loadClothingItems() {
    const userId = auth.currentUser.uid;
    db.collection('clothing').where('userId', '==', userId).get().then((querySnapshot) => {
        const itemsList = document.getElementById('items');
        itemsList.innerHTML = ''; // Clear existing items
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `${item.name} (${item.type}, ${item.color}, Size: ${item.size}) <button onclick="increaseUsage('${doc.id}')">Wear</button>`;
            itemsList.appendChild(li);
        });
        loadUsageGraph();
    });
}

// Increase usage count
function increaseUsage(id) {
    const itemRef = db.collection('clothing').doc(id);
    itemRef.update({
        usageCount: firebase.firestore.FieldValue.increment(1) // Increment usage count
    }).then(() => {
        loadClothingItems(); // Refresh the list
    }).catch((error) => {
        console.error("Error updating usage: ", error);
    });
}

// Load usage graph
function loadUsageGraph() {
    const userId = auth.currentUser.uid;
    db.collection('clothing').where('userId', '==', userId).get().then((querySnapshot) => {
        const usageData = [];
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            usageData.push({ name: item.name, usageCount: item.usageCount });
        });
        displayGraph(usageData);
    });
}

// Display graph using Chart.js (make sure to include Chart.js in your HTML)
function displayGraph(data) {
    const ctx = document.getElementById('usageCanvas').getContext('2d');
    const labels = data.map(item => item.name);
    const usageCounts = data.map(item => item.usageCount);

    const chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Usage Count',
                data: usageCounts,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}    