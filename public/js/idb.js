let db;
const request = indexedDB.open('budget-tracker', 1);

request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore('new_expense', { autoIncrement: true });
};

request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadExpense();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(['new_expense'], 'readwrite');
  const expenseObjectStore = transaction.objectStore('new_expense');
  expenseObjectStore.add(record);
}

function uploadExpense() {
  const transaction = db.transaction(['new_expense'], 'readwrite');
  const expenseObjectStore = transaction.objectStore('new_expense');
  const getAll = expenseObjectStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(['new_expense'], 'readwrite');
          const pizzaObjectStore = transaction.objectStore('new_expense');
          // clear all items in your store
          pizzaObjectStore.clear();
        })
        .catch(err => {
          // set reference to redirect back here
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);
